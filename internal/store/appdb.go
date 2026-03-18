package store

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"

	"invite-bonus/internal/config"
)

// ConnectAppDatabase connects to the application's own PostgreSQL database.
// It will create the database if it does not exist, then initialise the schema.
func ConnectAppDatabase(cfg config.AppDatabase) (*sql.DB, error) {
	// First connect to the default "postgres" database to check/create the target DB.
	adminDSN := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=postgres sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.SSLMode)

	adminDB, err := sql.Open("postgres", adminDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open admin connection: %w", err)
	}
	defer adminDB.Close()

	if err = adminDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping app database server: %w", err)
	}

	var exists bool
	err = adminDB.QueryRow(`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)`, cfg.DB).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check database existence: %w", err)
	}
	if !exists {
		if _, err = adminDB.Exec(fmt.Sprintf(`CREATE DATABASE %q`, cfg.DB)); err != nil {
			return nil, fmt.Errorf("failed to create database %q: %w", cfg.DB, err)
		}
	}

	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DB, cfg.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open app database: %w", err)
	}
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping app database: %w", err)
	}

	if err = initSchema(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialise schema: %w", err)
	}

	return db, nil
}

// initSchema creates all tables required by this application if they do not yet exist.
//
// Tables:
//
//	invite_code   – one invite code per (user_id, game_id); code is globally unique.
//	redeem_record – one row per redemption event (user can only redeem once per game).
func initSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS invite_code (
			user_id  BIGINT      NOT NULL,
			game_id  BIGINT      NOT NULL,
			code     VARCHAR(32) NOT NULL,
			PRIMARY KEY (user_id, game_id),
			UNIQUE (code)
		);

		CREATE TABLE IF NOT EXISTS redeem_record (
			id           BIGSERIAL   PRIMARY KEY,
			user_id      BIGINT      NOT NULL,
			peer_user_id BIGINT      NOT NULL,
			peer_team_id BIGINT      NOT NULL,
			invite_code  VARCHAR(32) NOT NULL,
			game_id      BIGINT      NOT NULL,
			bonus_score  INT         NOT NULL DEFAULT 0,
			timestamp    BIGINT      NOT NULL,
			UNIQUE (user_id, game_id)
		);

		CREATE INDEX IF NOT EXISTS idx_redeem_record_peer_user
			ON redeem_record (peer_user_id, game_id);
		CREATE INDEX IF NOT EXISTS idx_redeem_record_peer_team
			ON redeem_record (peer_team_id, game_id);
	`)
	return err
}
