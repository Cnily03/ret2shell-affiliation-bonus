package service

import (
	"database/sql"
	"time"

	"affiliation-bonus/internal/model"
)

// R2SService wraps all read/write operations against the Ret2Shell database.
type R2SService struct {
	db               *sql.DB
	imageURITemplate string
}

func NewR2SService(db *sql.DB, imageURITemplate string) *R2SService {
	return &R2SService{db: db, imageURITemplate: imageURITemplate}
}

func (s *R2SService) GetUser(userID int64) (model.UserBrief, error) {
	var account, nickname string
	var avatar sql.NullString
	err := s.db.QueryRow(
		`SELECT account, nickname, avatar FROM "user" WHERE id = $1`, userID,
	).Scan(&account, &nickname, &avatar)
	if err != nil {
		return model.UserBrief{}, err
	}
	return model.UserBrief{
		ID:        userID,
		Account:   account,
		Nickname:  nickname,
		AvatarURI: model.BuildImageURI(s.imageURITemplate, avatar.String, account),
	}, nil
}

// GameRow holds a GameBrief along with the raw end_at value for ended-check.
type GameRow struct {
	model.GameBrief
	EndAt sql.NullTime
}

func (s *R2SService) GetGame(gameID int64) GameRow {
	var name, brief string
	var logo sql.NullString
	var endAt sql.NullTime
	s.db.QueryRow(
		`SELECT name, brief, logo, end_at FROM game WHERE id = $1`, gameID,
	).Scan(&name, &brief, &logo, &endAt)
	return GameRow{
		GameBrief: model.GameBrief{
			ID:      gameID,
			Name:    name,
			Brief:   brief,
			LogoURI: model.BuildImageURI(s.imageURITemplate, logo.String, name),
		},
		EndAt: endAt,
	}
}

func (s *R2SService) IsGameEnded(gameID int64) bool {
	var endAt sql.NullTime
	s.db.QueryRow(`SELECT end_at FROM game WHERE id = $1`, gameID).Scan(&endAt)
	return endAt.Valid && time.Now().After(endAt.Time)
}

// TeamRow holds the id and name of a team.
type TeamRow struct {
	ID   int64
	Name string
}

// GetUserTeam returns the team the user belongs to in the given game.
func (s *R2SService) GetUserTeam(userID, gameID int64) (TeamRow, error) {
	var row TeamRow
	err := s.db.QueryRow(
		`SELECT t.id, t.name FROM team t
		 JOIN user2_team ut ON ut.team_id = t.id
		 WHERE ut.user_id = $1 AND t.game_id = $2 LIMIT 1`,
		userID, gameID,
	).Scan(&row.ID, &row.Name)
	return row, err
}

func (s *R2SService) GetTeamName(teamID int64) string {
	var name string
	s.db.QueryRow(`SELECT name FROM team WHERE id = $1`, teamID).Scan(&name)
	return name
}

// GetTeamMembers returns all user IDs that belong to the given team.
func (s *R2SService) GetTeamMembers(teamID int64) ([]int64, error) {
	rows, err := s.db.Query(`SELECT user_id FROM user2_team WHERE team_id = $1`, teamID)
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
	return members, nil
}

// InsertExtra writes a bonus record into the ret2shell extra table.
func (s *R2SService) InsertExtra(reason string, score int, teamID int64) error {
	_, err := s.db.Exec(
		`INSERT INTO extra (reason, score, team_id) VALUES ($1, $2, $3)`,
		reason, score, teamID,
	)
	return err
}

// UpdateTeamScore adds delta to the team's score.
func (s *R2SService) UpdateTeamScore(teamID int64, delta int) error {
	_, err := s.db.Exec(
		`UPDATE team SET score = score + $1 WHERE id = $2`,
		delta, teamID,
	)
	return err
}
