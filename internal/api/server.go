package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"bxsctf-invite-bonus/internal/auth"
	"bxsctf-invite-bonus/internal/model"
	"bxsctf-invite-bonus/internal/service"
)

type contextKey string

const checkContextKey contextKey = "check"

// Server holds all dependencies for the API handlers.
type Server struct {
	DB                *sql.DB
	Cache             *redis.Client
	BonusService      *service.BonusService
	AuthMW            func(http.HandlerFunc) http.HandlerFunc
	CachePrefix       string
	ImageURITemplate  string
}

func (s *Server) isGameEnded() bool {
	var endAt sql.NullTime
	s.DB.QueryRow(`SELECT end_at FROM game WHERE id = $1`, s.BonusService.Config.GameID).Scan(&endAt)
	return endAt.Valid && time.Now().After(endAt.Time)
}

func (s *Server) checkMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return s.AuthMW(func(w http.ResponseWriter, r *http.Request) {
		claims := auth.GetUserFromContext(r)
		if claims == nil {
			writeText(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		checkResp, err := s.BonusService.PerformCheck(claims.ID)
		if err != nil {
			if s.isGameEnded() {
				writeText(w, http.StatusServiceUnavailable, "the game has ended")
				return
			}
			writeText(w, http.StatusPreconditionFailed, "please create a team first")
			return
		}

		ctx := context.WithValue(r.Context(), checkContextKey, checkResp)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getCheckFromContext(r *http.Request) *model.CheckResponse {
	resp, _ := r.Context().Value(checkContextKey).(*model.CheckResponse)
	return resp
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeText(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(status)
	w.Write([]byte(msg))
}
