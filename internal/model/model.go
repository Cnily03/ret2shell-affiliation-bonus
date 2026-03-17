package model

import (
	"encoding/base64"
	"fmt"
	"strings"
	"unicode/utf8"
)

const svgFontFamily = `"Menlo", "-apple-system", "Noto Sans", "Helvetica Neue", "Helvetica", "Nimbus Sans L", "Arial", "Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Consolas", "Courier", "monospace"`

// BuildImageURI returns an image URI for the given hash.
// If hash is non-empty, it uses the template with {avatar} replaced by hash.
// Otherwise, it generates an SVG data URL with the first letter of alt.
func BuildImageURI(hash, alt, template string) string {
	if hash != "" && template != "" {
		return strings.ReplaceAll(template, "{hash}", hash)
	}
	letter := "A"
	if alt != "" {
		r, _ := utf8.DecodeRuneInString(alt)
		letter = strings.ToUpper(string(r))
	}
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#0991ed"/><text x="64" y="64" dy=".35em" text-anchor="middle" fill="#000" font-size="64" font-family='%s'>%s</text></svg>`, svgFontFamily, letter)
	return "data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString([]byte(svg))
}

// API response structs

type GameResponse struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Brief   string `json:"brief"`
	LogoURI string `json:"logo_uri"`
}

type InfoResponse struct {
	ID        int64  `json:"id"`
	Account   string `json:"account"`
	Nickname  string `json:"nickname"`
	AvatarURI string `json:"avatar_uri"`
	GameID    int64  `json:"game_id"`
}

type CheckTeam struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	Members []int64 `json:"members"`
}

type CheckResponse struct {
	GameID int64     `json:"game_id"`
	User   UserBrief `json:"user"`
	Team   CheckTeam `json:"team"`
}

type InviteCodeResponse struct {
	InviteCode string `json:"invite_code"`
}

type RedeemRequest struct {
	InviteCode string `json:"invite_code"`
}

type UserBrief struct {
	ID        int64  `json:"id"`
	Account   string `json:"account"`
	Nickname  string `json:"nickname"`
	AvatarURI string `json:"avatar_uri"`
}

type TeamBrief struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type RedeemResponse struct {
	UserID     int64     `json:"user_id"`
	InviteCode string    `json:"invite_code"`
	PeerUser   UserBrief `json:"peer_user"`
	PeerTeam   TeamBrief `json:"peer_team"`
	Timestamp  int64     `json:"timestamp"`
}

type StatusResponse struct {
	InviteCode string         `json:"invite_code"`
	Invited    []InvitedEntry `json:"invited"`
	From       *FromEntry     `json:"from"`
}

type InvitedEntry struct {
	User       UserBrief `json:"user"`
	InviteCode string    `json:"invite_code"`
	Timestamp  int64     `json:"timestamp"`
	BonusTeam  TeamBrief `json:"bonus_team"`
	BonusScore int       `json:"bonus_score"`
}

type FromEntry struct {
	InviteCode string    `json:"invite_code"`
	PeerUser   UserBrief `json:"peer_user"`
	PeerTeam   TeamBrief `json:"peer_team"`
	Timestamp  int64     `json:"timestamp"`
}

// Cache structs
//
// Cache key mapping:
//   user:<user_id>:code              -> string (invite code)
//   user:<user_id>:invited           -> JSON array of CacheInvitedEntry
//   user:<user_id>:from              -> JSON object of CacheFromEntry
//   invite_code:<invite_code>        -> string (user_id of the code owner)
//   team:<team_id>:score             -> JSON array of CacheTeamScoreEntry

type CacheInvitedEntry struct {
	UserID        int64  `json:"user_id"`
	InviteCode    string `json:"invite_code"`
	Timestamp     int64  `json:"timestamp"`
	BonusTeamID   int64  `json:"bonus_team_id"`
	BonusTeamName string `json:"bonus_team_name"`
	BonusScore    int    `json:"bonus_score"`
}

type CacheFromEntry struct {
	InviteCode string `json:"invite_code"`
	PeerUserID int64  `json:"peer_user_id"`
	PeerTeamID int64  `json:"peer_team_id"`
	Timestamp  int64  `json:"timestamp"`
}

type CacheTeamScoreEntry struct {
	PeerUserID   int64  `json:"peer_user_id"`
	RedeemUserID int64  `json:"redeem_user_id"`
	InviteCode   string `json:"invite_code"`
	BonusScore   int    `json:"bonus_score"`
	Timestamp    int64  `json:"timestamp"`
}
