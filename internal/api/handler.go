package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	gonanoid "github.com/jaevor/go-nanoid"
	"github.com/redis/go-redis/v9"

	"bxsctf-invite-bonus/internal/auth"
	"bxsctf-invite-bonus/internal/model"
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

func (s *Server) cacheKey(parts ...string) string {
	result := s.CachePrefix
	for _, p := range parts {
		result += ":" + p
	}
	return result
}

// POST /api/info
func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var avatar sql.NullString
	s.DB.QueryRow(`SELECT avatar FROM "user" WHERE id = $1`, claims.ID).Scan(&avatar)

	writeJSON(w, http.StatusOK, model.InfoResponse{
		ID:        claims.ID,
		Account:   claims.Account,
		Nickname:  claims.Nickname,
		AvatarURI: model.BuildImageURI(avatar.String, claims.Account, s.ImageURITemplate),
		GameID:    s.BonusService.Config.GameID,
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
		writeText(w, http.StatusPreconditionFailed, "please create a team first")
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

	ctx := context.Background()
	userIDStr := strconv.FormatInt(claims.ID, 10)

	code, err := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "code")).Result()
	if err == nil && code != "" {
		writeJSON(w, http.StatusOK, model.InviteCodeResponse{InviteCode: code})
		return
	}

	code = generateNanoID()
	pipe := s.Cache.Pipeline()
	pipe.Set(ctx, s.cacheKey("user", userIDStr, "code"), code, 0)
	pipe.Set(ctx, s.cacheKey("invite_code", code), userIDStr, 0)
	if _, err := pipe.Exec(ctx); err != nil {
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

	log.Printf("[PATCH /api/invite_code] user=%s#%d", claims.Account, claims.ID)

	ctx := context.Background()
	userIDStr := strconv.FormatInt(claims.ID, 10)

	oldCode, err := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "code")).Result()
	if err == nil && oldCode != "" {
		s.Cache.Del(ctx, s.cacheKey("invite_code", oldCode))
	}

	code := generateNanoID()
	pipe := s.Cache.Pipeline()
	pipe.Set(ctx, s.cacheKey("user", userIDStr, "code"), code, 0)
	pipe.Set(ctx, s.cacheKey("invite_code", code), userIDStr, 0)
	if _, err := pipe.Exec(ctx); err != nil {
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

	log.Printf("[POST /api/redeem_code] user=%s#%d", claims.Account, claims.ID)

	ctx := context.Background()
	userIDStr := strconv.FormatInt(claims.ID, 10)

	_, err := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "from")).Result()
	if err == nil {
		writeText(w, http.StatusConflict, "you already redeemed an invite code")
		return
	}

	var req model.RedeemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.InviteCode == "" {
		writeText(w, http.StatusBadRequest, "invalid request")
		return
	}

	peerUserIDStr, err := s.Cache.Get(ctx, s.cacheKey("invite_code", req.InviteCode)).Result()
	if err == redis.Nil || peerUserIDStr == "" {
		writeText(w, http.StatusNotFound, "invalid invite code")
		return
	}
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	peerUserID, err := strconv.ParseInt(peerUserIDStr, 10, 64)
	if err != nil {
		writeText(w, http.StatusNotFound, "invalid invite code")
		return
	}

	for _, memberID := range check.Team.Members {
		if memberID == peerUserID {
			writeText(w, http.StatusBadRequest, "cannot redeem your own invite code")
			return
		}
	}

	bonusScore, peerTeamID, peerTeamName, err := s.BonusService.GiveBonus(claims.ID, peerUserID, req.InviteCode)
	if err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	var peerAccount, peerNickname string
	var peerAvatar sql.NullString
	if err := s.DB.QueryRow(`SELECT account, nickname, avatar FROM "user" WHERE id = $1`, peerUserID).Scan(&peerAccount, &peerNickname, &peerAvatar); err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	now := time.Now().Unix()

	invitedJSON, _ := s.Cache.Get(ctx, s.cacheKey("user", peerUserIDStr, "invited")).Result()
	var invited []model.CacheInvitedEntry
	if invitedJSON != "" {
		json.Unmarshal([]byte(invitedJSON), &invited)
	}
	invited = append(invited, model.CacheInvitedEntry{
		UserID:        claims.ID,
		InviteCode:    req.InviteCode,
		Timestamp:     now,
		BonusTeamID:   peerTeamID,
		BonusTeamName: peerTeamName,
		BonusScore:    bonusScore,
	})
	invitedBytes, _ := json.Marshal(invited)

	fromEntry := model.CacheFromEntry{
		InviteCode: req.InviteCode,
		PeerUserID: peerUserID,
		PeerTeamID: peerTeamID,
		Timestamp:  now,
	}
	fromBytes, _ := json.Marshal(fromEntry)

	pipe := s.Cache.Pipeline()
	pipe.Set(ctx, s.cacheKey("user", peerUserIDStr, "invited"), string(invitedBytes), 0)
	pipe.Set(ctx, s.cacheKey("user", userIDStr, "from"), string(fromBytes), 0)
	if _, err := pipe.Exec(ctx); err != nil {
		writeText(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, model.RedeemResponse{
		UserID:     claims.ID,
		InviteCode: req.InviteCode,
		PeerUser: model.UserBrief{
			ID:        peerUserID,
			Account:   peerAccount,
			Nickname:  peerNickname,
			AvatarURI: model.BuildImageURI(peerAvatar.String, peerAccount, s.ImageURITemplate),
		},
		PeerTeam:  model.TeamBrief{ID: peerTeamID, Name: peerTeamName},
		Timestamp: now,
	})
}

// GET /api/status
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r)
	if claims == nil {
		writeText(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	ctx := context.Background()
	userIDStr := strconv.FormatInt(claims.ID, 10)

	code, err := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "code")).Result()
	if err != nil || code == "" {
		code = generateNanoID()
		pipe := s.Cache.Pipeline()
		pipe.Set(ctx, s.cacheKey("user", userIDStr, "code"), code, 0)
		pipe.Set(ctx, s.cacheKey("invite_code", code), userIDStr, 0)
		pipe.Exec(ctx)
	}

	invitedJSON, _ := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "invited")).Result()
	var cacheInvited []model.CacheInvitedEntry
	if invitedJSON != "" {
		json.Unmarshal([]byte(invitedJSON), &cacheInvited)
	}

	invitedEntries := make([]model.InvitedEntry, 0, len(cacheInvited))
	for _, ci := range cacheInvited {
		var account, nickname string
		var avatar sql.NullString
		err := s.DB.QueryRow(`SELECT account, nickname, avatar FROM "user" WHERE id = $1`, ci.UserID).Scan(&account, &nickname, &avatar)
		if err != nil {
			continue
		}
		invitedEntries = append(invitedEntries, model.InvitedEntry{
			User: model.UserBrief{
				ID:        ci.UserID,
				Account:   account,
				Nickname:  nickname,
				AvatarURI: model.BuildImageURI(avatar.String, account, s.ImageURITemplate),
			},
			InviteCode: ci.InviteCode,
			Timestamp:  ci.Timestamp,
			BonusTeam:  model.TeamBrief{ID: ci.BonusTeamID, Name: ci.BonusTeamName},
			BonusScore: ci.BonusScore,
		})
	}

	var from *model.FromEntry
	fromJSON, err := s.Cache.Get(ctx, s.cacheKey("user", userIDStr, "from")).Result()
	if err == nil && fromJSON != "" {
		var f model.CacheFromEntry
		if json.Unmarshal([]byte(fromJSON), &f) == nil {
			var peerAccount, peerNickname string
			var peerAvatar sql.NullString
			s.DB.QueryRow(`SELECT account, nickname, avatar FROM "user" WHERE id = $1`, f.PeerUserID).Scan(&peerAccount, &peerNickname, &peerAvatar)
			var peerTeamName string
			s.DB.QueryRow(`SELECT name FROM team WHERE id = $1`, f.PeerTeamID).Scan(&peerTeamName)
			from = &model.FromEntry{
				InviteCode: f.InviteCode,
				PeerUser: model.UserBrief{
					ID:        f.PeerUserID,
					Account:   peerAccount,
					Nickname:  peerNickname,
					AvatarURI: model.BuildImageURI(peerAvatar.String, peerAccount, s.ImageURITemplate),
				},
				PeerTeam:  model.TeamBrief{ID: f.PeerTeamID, Name: peerTeamName},
				Timestamp: f.Timestamp,
			}
		}
	}

	writeJSON(w, http.StatusOK, model.StatusResponse{
		InviteCode: code,
		Invited:    invitedEntries,
		From:       from,
	})
}
// GET /api/game
func (s *Server) handleGame(w http.ResponseWriter, r *http.Request) {
	gameID := s.BonusService.Config.GameID
	var name, brief string
	var logo sql.NullString
	err := s.DB.QueryRow(`SELECT name, brief, logo FROM game WHERE id = $1`, gameID).Scan(&name, &brief, &logo)
	if err != nil {
		writeText(w, http.StatusNotFound, "not found")
		return
	}
	writeJSON(w, http.StatusOK, model.GameResponse{
		ID:      gameID,
		Name:    name,
		Brief:   brief,
		LogoURI: model.BuildImageURI(logo.String, name, s.ImageURITemplate),
	})
}