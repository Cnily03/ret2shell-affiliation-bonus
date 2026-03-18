package config

import (
	"fmt"

	"github.com/BurntSushi/toml"
)

type AppDatabase struct {
	Host     string `toml:"host"`
	Port     int    `toml:"port"`
	SSLMode  string `toml:"ssl_mode"`
	User     string `toml:"user"`
	Password string `toml:"password"`
	DB       string `toml:"db"`
}

type ServerConfig struct {
	StaticPath       string `toml:"static_path"`
	ImageURITemplate string `toml:"image_uri_template"`
}

type BonusConfig struct {
	GameID     int64 `toml:"game_id"`
	BonusScore int   `toml:"bonus_score"`
	MaxScore   int   `toml:"max_score"`
}

type Ret2ShellConfig struct {
	Auth     Ret2ShellAuth     `toml:"auth"`
	Database Ret2ShellDatabase `toml:"database"`
}

type Ret2ShellAuth struct {
	SigningKey string `toml:"signing_key"`
}

type Ret2ShellDatabase struct {
	Host     string `toml:"host"`
	Port     int    `toml:"port"`
	SSLMode  string `toml:"ssl_mode"`
	User     string `toml:"user"`
	Password string `toml:"password"`
	DB       string `toml:"db"`
}

type Config struct {
	Ret2Shell Ret2ShellConfig `toml:"ret2shell"`
	Server    ServerConfig    `toml:"server"`
	Database  AppDatabase     `toml:"database"`
	Bonus     BonusConfig     `toml:"bonus"`
}

func Load(configPath string) (*Config, error) {
	var cfg Config
	if _, err := toml.DecodeFile(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}
	return &cfg, nil
}
