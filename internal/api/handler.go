package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	gonanoid "github.com/jaevor/go-nanoid"

	"invite-bonus/internal/auth"
	"invite-bonus/internal/model"
)

const nanoidAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const nanoidLength = 12

var generateNanoID func() string

func init() {
	var err error
	generateNanoID, err = gonanoid.CustomASCII(nanoidAlphabet, nanoidLength)
	if err != nil {
		panic(err)
	}
}

// GET /api/info
func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	userBrief, _ := s.R2S.GetUser(claims.ID)

	gameID := s.BonusService.Config.GameID
	gameRow := s.R2S.GetGame(gameID)
	gameEnded := gameRow.EndAt.Valid && time.Now().After(gameRow.EndAt.Time)

	writeJSON(w, http.StatusOK, model.InfoResponse{
		User: userBrief,
		Game: gameRow.GameBrief,
		Bonus: model.BonusInfo{
			GameID:     gameID,
			BonusScore: s.BonusService.Config.BonusScore,
			MaxScore:   s.BonusService.Config.MaxScore,
			GameEnded:  gameEnded,
		},
	})
}

// POST /api/check
func (s *Server) handleCheck(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	log.Printf("[POST /api/check] user=%s#%d", claims.Account, claims.ID)

	checkResp, err := s.BonusService.PerformCheck(claims.ID)
	if err != nil {
		writeText(w, http.StatusPreconditionFailed, "please create or join a team first")
		return
	}

	writeJSON(w, http.StatusOK, checkResp)
}

// GET /api/invite_code
func (s *Server) handleGetInviteCode(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	gameID := s.BonusService.Config.GameID

	var code string
	err := s.AppDB.QueryRow(
		`SELECT code FROM invite_code WHERE user_id = $1 AND game_id = $2`,
		claims.ID, gameID,
	).Scan(&code)
	if err == nil {
		writeJSON(w, http.StatusOK, model.InviteCodeResponse{InviteCode: code})
		return
	}

	code = generateNanoID()
	_, err = s.AppDB.Exec(
		`INSERT INTO invite_code (user_id, game_id, code) VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, game_id) DO UPDATE SET code = EXCLUDED.code`,
		claims.ID, gameID, code,
	)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, model.InviteCodeResponse{InviteCode: code})
}

// PATCH /api/invite_code
func (s *Server) handlePatchInviteCode(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if s.isGameEnded() {
		writeText(w, http.StatusServiceUnavailable, "the game has ended")
		return
	}

	log.Printf("[PATCH /api/invite_code] user=%s#%d", claims.Account, claims.ID)

	gameID := s.BonusService.Config.GameID
	code := generateNanoID()

	_, err := s.AppDB.Exec(
		`INSERT INTO invite_code (user_id, game_id, code) VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, game_id) DO UPDATE SET code = EXCLUDED.code`,
		claims.ID, gameID, code,
	)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, model.InviteCodeResponse{InviteCode: code})
}

// POST /api/redeem_code
func (s *Server) handleRedeemCode(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	check := getCheckFromContext(r)
	if claims == nil || check == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if s.isGameEnded() {
		writeText(w, http.StatusServiceUnavailable, "the game has ended")
		return
	}

	log.Printf("[POST /api/redeem_code] user=%s#%d", claims.Account, claims.ID)

	gameID := s.BonusService.Config.GameID

	// Check if the user already redeemed.
	var exists int
	err := s.AppDB.QueryRow(
		`SELECT 1 FROM redeem_record WHERE user_id = $1 AND game_id = $2`,
		claims.ID, gameID,
	).Scan(&exists)
	if err == nil {
		writeText(w, http.StatusConflict, "you already redeemed an invite code")
		return
	}

	var req model.RedeemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.InviteCode == "" {
		writeText(w, http.StatusBadRequest, "invalid request")
		return
	}

	// Look up the code owner.
	var peerUserID int64
	err = s.AppDB.QueryRow(
		`SELECT user_id FROM invite_code WHERE code = $1`,
		req.InviteCode,
	).Scan(&peerUserID)
	if err != nil {
		writeText(w, http.StatusNotFound, "invalid invite code")
		return
	}

	for _, memberID := range check.Team.Members {
		if memberID == peerUserID {
			writeText(w, http.StatusForbidden, "cannot redeem your own invite code")
			return
		}
	}

	_, peerTeamID, peerTeamName, err := s.BonusService.GiveBonus(claims.ID, peerUserID, req.InviteCode)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	peerUser, err := s.R2S.GetUser(peerUserID)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	// Retrieve the recorded timestamp from app DB.
	var timestamp int64
	s.AppDB.QueryRow(
		`SELECT timestamp FROM redeem_record WHERE user_id = $1 AND game_id = $2`,
		claims.ID, gameID,
	).Scan(&timestamp)

	writeJSON(w, http.StatusOK, model.RedeemResponse{
		UserID:     claims.ID,
		InviteCode: req.InviteCode,
		PeerUser:   peerUser,
		PeerTeam:   model.TeamBrief{ID: peerTeamID, Name: peerTeamName},
		Timestamp:  timestamp,
	})
}

// GET /api/status
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	gameID := s.BonusService.Config.GameID

	// Get or create invite code.
	var code string
	err := s.AppDB.QueryRow(
		`SELECT code FROM invite_code WHERE user_id = $1 AND game_id = $2`,
		claims.ID, gameID,
	).Scan(&code)
	if err != nil {
		code = generateNanoID()
		s.AppDB.Exec(
			`INSERT INTO invite_code (user_id, game_id, code) VALUES ($1, $2, $3)
			 ON CONFLICT (user_id, game_id) DO UPDATE SET code = EXCLUDED.code`,
			claims.ID, gameID, code,
		)
	}

	// Fetch all users that this user invited (redeem rows where peer_user_id = claims.ID).
	rows, err := s.AppDB.Query(
		`SELECT user_id, invite_code, bonus_score, peer_team_id, timestamp
		 FROM redeem_record WHERE peer_user_id = $1 AND game_id = $2
		 ORDER BY timestamp ASC`,
		claims.ID, gameID,
	)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer rows.Close()

	invitedEntries := make([]model.InvitedEntry, 0)
	for rows.Next() {
		var redeemerID, teamID, ts int64
		var invCode string
		var bonusScore int
		if err := rows.Scan(&redeemerID, &invCode, &bonusScore, &teamID, &ts); err != nil {
			continue
		}

		userBrief, err := s.R2S.GetUser(redeemerID)
		if err != nil {
			continue
		}
		teamName := s.R2S.GetTeamName(teamID)

		invitedEntries = append(invitedEntries, model.InvitedEntry{
			User:       userBrief,
			InviteCode: invCode,
			Timestamp:  ts,
			BonusTeam:  model.TeamBrief{ID: teamID, Name: teamName},
			BonusScore: bonusScore,
		})
	}

	// Fetch "from" entry: the row where user_id = claims.ID.
	var from *model.FromEntry
	var peerUserID, peerTeamID, fromTS int64
	var fromCode string
	err = s.AppDB.QueryRow(
		`SELECT peer_user_id, peer_team_id, invite_code, timestamp
		 FROM redeem_record WHERE user_id = $1 AND game_id = $2`,
		claims.ID, gameID,
	).Scan(&peerUserID, &peerTeamID, &fromCode, &fromTS)
	if err == nil {
		peerUser, _ := s.R2S.GetUser(peerUserID)
		peerTeamName := s.R2S.GetTeamName(peerTeamID)
		from = &model.FromEntry{
			InviteCode: fromCode,
			PeerUser:   peerUser,
			PeerTeam:   model.TeamBrief{ID: peerTeamID, Name: peerTeamName},
			Timestamp:  fromTS,
		}
	}

	writeJSON(w, http.StatusOK, model.StatusResponse{
		InviteCode: code,
		Invited:    invitedEntries,
		From:       from,
	})
}
