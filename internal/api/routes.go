package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

func methodNotAllowed(w http.ResponseWriter, _ *http.Request) {
	writeText(w, http.StatusMethodNotAllowed, "method not allowed")
}

func notFound(w http.ResponseWriter, _ *http.Request) {
	writeText(w, http.StatusNotFound, "not found")
}

// SetupRoutes registers all API routes on the mux router.
func (s *Server) SetupRoutes(r *mux.Router) {
	api := r.PathPrefix("/api").Subrouter()

	api.HandleFunc("/check", s.AuthMW(s.handleCheck)).Methods(http.MethodPost)
	api.HandleFunc("/check", methodNotAllowed)

	api.HandleFunc("/invite_code", s.checkMiddleware(s.handleGetInviteCode)).Methods(http.MethodGet)
	api.HandleFunc("/invite_code", s.checkMiddleware(s.handlePatchInviteCode)).Methods(http.MethodPatch)
	api.HandleFunc("/invite_code", methodNotAllowed)

	api.HandleFunc("/redeem_code", s.checkMiddleware(s.handleRedeemCode)).Methods(http.MethodPost)
	api.HandleFunc("/redeem_code", methodNotAllowed)

	api.HandleFunc("/status", s.checkMiddleware(s.handleStatus)).Methods(http.MethodGet)
	api.HandleFunc("/status", methodNotAllowed)

	api.PathPrefix("/").HandlerFunc(notFound)
}
