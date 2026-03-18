package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

type AppConfig struct {
	Ret2Shell Ret2ShellRef `toml:"ret2shell"`
	Server    ServerConfig `toml:"server"`
	Bonus     BonusConfig  `toml:"bonus"`
}

type ServerConfig struct {
	CachePrefix      string `toml:"cache_prefix"`
	StaticPath       string `toml:"static_path"`
	ImageURITemplate string `toml:"image_uri_template"`
}

type Ret2ShellRef struct {
	ConfigPath string `toml:"config_path"`
}

type BonusConfig struct {
	GameID     int64 `toml:"game_id"`
	BonusScore int   `toml:"bonus_score"`
	MaxScore   int   `toml:"max_score"`
}

type Ret2ShellConfig struct {
	Auth     Ret2ShellAuth     `toml:"auth"`
	Cache    Ret2ShellCache    `toml:"cache"`
	Database Ret2ShellDatabase `toml:"database"`
}

type Ret2ShellAuth struct {
	SigningKey string `toml:"signing_key"`
}

type Ret2ShellCache struct {
	URL string `toml:"url"`
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
	App       AppConfig
	Ret2Shell Ret2ShellConfig
}

func Load(configPath string) (*Config, error) {
	var app AppConfig
	if _, err := toml.DecodeFile(configPath, &app); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	r2Path := app.Ret2Shell.ConfigPath
	if !filepath.IsAbs(r2Path) {
		r2Path = filepath.Join(filepath.Dir(configPath), r2Path)
	}

	if _, err := os.Stat(r2Path); err != nil {
		return nil, fmt.Errorf("ret2shell config not found: %w", err)
	}

	var r2 Ret2ShellConfig
	if _, err := toml.DecodeFile(r2Path, &r2); err != nil {
		return nil, fmt.Errorf("failed to load ret2shell config: %w", err)
	}

	return &Config{App: app, Ret2Shell: r2}, nil
}
