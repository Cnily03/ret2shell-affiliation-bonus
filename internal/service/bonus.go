package service

import (
	"database/sql"
	"fmt"
	"time"

	"affiliation-bonus/internal/config"
	"affiliation-bonus/internal/model"
)

type BonusService struct {
	R2S    *R2SService
	AppDB  *sql.DB
	Config config.BonusConfig
}

// GiveBonus grants bonus points to the peer's team and records the redemption.
// Returns (actualScore, peerTeamID, peerTeamName, error).
func (s *BonusService) GiveBonus(redeemUserID, peerUserID int64, inviteCode string) (int, int64, string, error) {
	gameID := s.Config.GameID
	bonusScore := s.Config.BonusScore
	maxScore := s.Config.MaxScore

	peerUser, err := s.R2S.GetUser(peerUserID)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get peer user: %w", err)
	}

	redeemUser, err := s.R2S.GetUser(redeemUserID)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get redeem user: %w", err)
	}

	peerTeam, err := s.R2S.GetUserTeam(peerUserID, gameID)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get peer team: %w", err)
	}
	peerTeamID := peerTeam.ID
	peerTeamName := peerTeam.Name

	// Sum bonus already awarded to the peer team in this game.
	var currentBonusSum int
	err = s.AppDB.QueryRow(
		`SELECT COALESCE(SUM(bonus_score), 0) FROM redeem_record WHERE peer_team_id = $1 AND game_id = $2`,
		peerTeamID, gameID,
	).Scan(&currentBonusSum)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to sum team bonus: %w", err)
	}

	actualScore := bonusScore
	if currentBonusSum+bonusScore > maxScore {
		actualScore = maxScore - currentBonusSum
	}
	if actualScore < 0 {
		actualScore = 0
	}

	now := time.Now().UnixMilli()

	if actualScore > 0 {
		reason := fmt.Sprintf("%s#%d invited %s#%d", peerUser.Account, peerUserID, redeemUser.Account, redeemUserID)

		if err = s.R2S.InsertExtra(reason, actualScore, peerTeamID); err != nil {
			return 0, 0, "", fmt.Errorf("failed to insert extra: %w", err)
		}

		if err = s.R2S.UpdateTeamScore(peerTeamID, actualScore); err != nil {
			return 0, 0, "", fmt.Errorf("failed to update team score: %w", err)
		}
	}

	// Record redemption in app DB (always, even when actualScore == 0).
	_, err = s.AppDB.Exec(
		`INSERT INTO redeem_record
		 (user_id, peer_user_id, peer_team_id, invite_code, game_id, bonus_score, timestamp)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		redeemUserID, peerUserID, peerTeamID, inviteCode, gameID, actualScore, now,
	)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to record redemption: %w", err)
	}

	return actualScore, peerTeamID, peerTeamName, nil
}

// PerformCheck returns the user's team info and cumulative bonus for the configured game.
func (s *BonusService) PerformCheck(userID int64) (*model.CheckResponse, error) {
	gameID := s.Config.GameID

	team, err := s.R2S.GetUserTeam(userID, gameID)
	if err != nil {
		return nil, err
	}
	teamID := team.ID
	teamName := team.Name

	members, err := s.R2S.GetTeamMembers(teamID)
	if err != nil {
		return nil, err
	}

	userBrief, err := s.R2S.GetUser(userID)
	if err != nil {
		return nil, err
	}

	var totalBonus int
	s.AppDB.QueryRow(
		`SELECT COALESCE(SUM(bonus_score), 0) FROM redeem_record WHERE peer_team_id = $1 AND game_id = $2`,
		teamID, gameID,
	).Scan(&totalBonus)

	return &model.CheckResponse{
		GameID: gameID,
		User:   userBrief,
		Team:   model.CheckTeam{ID: teamID, Name: teamName, Members: members, TotalBonus: totalBonus},
	}, nil
}
