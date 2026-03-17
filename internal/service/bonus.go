package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"bxsctf-invite-bonus/internal/config"
	"bxsctf-invite-bonus/internal/model"
)

type BonusService struct {
	DB                *sql.DB
	Cache             *redis.Client
	CachePrefix       string
	Config            config.BonusConfig
	ImageURITemplate string
}

func (s *BonusService) cacheKey(parts ...string) string {
	result := s.CachePrefix
	for _, p := range parts {
		result += ":" + p
	}
	return result
}

// GiveBonus returns (actualScore, peerTeamID, peerTeamName, error).
func (s *BonusService) GiveBonus(redeemUserID, peerUserID int64, inviteCode string) (int, int64, string, error) {
	ctx := context.Background()
	gameID := s.Config.GameID
	bonusScore := s.Config.BonusScore
	maxScore := s.Config.MaxScore

	var peerAccount string
	err := s.DB.QueryRow(`SELECT account FROM "user" WHERE id = $1`, peerUserID).Scan(&peerAccount)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get peer user: %w", err)
	}

	var redeemAccount string
	err = s.DB.QueryRow(`SELECT account FROM "user" WHERE id = $1`, redeemUserID).Scan(&redeemAccount)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get redeem user: %w", err)
	}

	var peerTeamID int64
	var peerTeamName string
	err = s.DB.QueryRow(
		`SELECT t.id, t.name FROM team t
		 JOIN user2_team ut ON ut.team_id = t.id
		 WHERE ut.user_id = $1 AND t.game_id = $2 LIMIT 1`,
		peerUserID, gameID,
	).Scan(&peerTeamID, &peerTeamName)
	if err != nil {
		return 0, 0, "", fmt.Errorf("failed to get peer team: %w", err)
	}

	// Read team score cache to get current bonus sum
	teamIDStr := strconv.FormatInt(peerTeamID, 10)
	teamScoreKey := s.cacheKey("team", teamIDStr, "score")

	var scoreEntries []model.CacheTeamScoreEntry
	scoreJSON, err := s.Cache.Get(ctx, teamScoreKey).Result()
	if err == nil && scoreJSON != "" {
		json.Unmarshal([]byte(scoreJSON), &scoreEntries)
	}

	var currentBonusSum int
	for _, e := range scoreEntries {
		currentBonusSum += e.BonusScore
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
		reason := fmt.Sprintf("%s#%d invited %s#%d to participate in this game", peerAccount, peerUserID, redeemAccount, redeemUserID)

		_, err = s.DB.Exec(
			`INSERT INTO extra (reason, score, team_id) VALUES ($1, $2, $3)`,
			reason, actualScore, peerTeamID,
		)
		if err != nil {
			return 0, 0, "", fmt.Errorf("failed to insert extra: %w", err)
		}

		_, err = s.DB.Exec(
			`UPDATE team SET score = score + $1 WHERE id = $2`,
			actualScore, peerTeamID,
		)
		if err != nil {
			return 0, 0, "", fmt.Errorf("failed to update team score: %w", err)
		}
	}

	// Always update team score cache
	scoreEntries = append(scoreEntries, model.CacheTeamScoreEntry{
		PeerUserID:   peerUserID,
		RedeemUserID: redeemUserID,
		InviteCode:   inviteCode,
		BonusScore:   actualScore,
		Timestamp:    now,
	})
	scoreBytes, _ := json.Marshal(scoreEntries)
	s.Cache.Set(ctx, teamScoreKey, string(scoreBytes), 0)

	return actualScore, peerTeamID, peerTeamName, nil
}

// PerformCheck queries the database to see if the user has a team in the configured game.
func (s *BonusService) PerformCheck(userID int64) (*model.CheckResponse, error) {
	gameID := s.Config.GameID

	var teamID int64
	var teamName string
	err := s.DB.QueryRow(
		`SELECT t.id, t.name FROM team t
		 JOIN user2_team ut ON ut.team_id = t.id
		 WHERE ut.user_id = $1 AND t.game_id = $2 LIMIT 1`,
		userID, gameID,
	).Scan(&teamID, &teamName)
	if err != nil {
		return nil, err
	}

	rows, err := s.DB.Query(
		`SELECT user_id FROM user2_team WHERE team_id = $1`, teamID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []int64
	for rows.Next() {
		var uid int64
		if err := rows.Scan(&uid); err != nil {
			return nil, err
		}
		members = append(members, uid)
	}

	var account, nickname string
	var avatar sql.NullString
	err = s.DB.QueryRow(`SELECT account, nickname, avatar FROM "user" WHERE id = $1`, userID).Scan(&account, &nickname, &avatar)
	if err != nil {
		return nil, err
	}

	teamIDStr := strconv.FormatInt(teamID, 10)
	var scoreEntries []model.CacheTeamScoreEntry
	if scoreJSON, err := s.Cache.Get(context.Background(), s.cacheKey("team", teamIDStr, "score")).Result(); err == nil && scoreJSON != "" {
		json.Unmarshal([]byte(scoreJSON), &scoreEntries)
	}
	var totalBonus int
	for _, e := range scoreEntries {
		totalBonus += e.BonusScore
	}

	return &model.CheckResponse{
		GameID: gameID,
		User: model.UserBrief{
			ID:        userID,
			Account:   account,
			Nickname:  nickname,
			AvatarURI: model.BuildImageURI(avatar.String, account, s.ImageURITemplate),
		},
		Team: model.CheckTeam{ID: teamID, Name: teamName, Members: members, TotalBonus: totalBonus},
	}, nil
}
