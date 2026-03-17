package store

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func ConnectCache(url string) (*redis.Client, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to parse cache url: %w", err)
	}

	rdb := redis.NewClient(opt)

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping cache: %w", err)
	}

	return rdb, nil
}
