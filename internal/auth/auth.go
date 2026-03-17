package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userContextKey contextKey = "user"

type JWTClaims struct {
	ID          int64  `json:"id"`
	Account     string `json:"account"`
	Nickname    string `json:"nickname"`
	Permissions []int  `json:"permissions"`
	jwt.RegisteredClaims
}

func GetUserFromContext(r *http.Request) *JWTClaims {
	claims, _ := r.Context().Value(userContextKey).(*JWTClaims)
	return claims
}

func Middleware(signingKey string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeText(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(signingKey), nil
			})
			if err != nil || !token.Valid {
				writeText(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			claims, ok := token.Claims.(*JWTClaims)
			if !ok {
				writeText(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			ctx := context.WithValue(r.Context(), userContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
	}
}

func writeText(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(status)
	w.Write([]byte(msg))
}
