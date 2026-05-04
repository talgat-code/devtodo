package database

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"devtodo/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ConnectionInfo struct {
	Host            string
	Port            string
	User            string
	Database        string
	SSLMode         string
	UsesDatabaseURL bool
	PasswordLength  int
}

func DescribeConnection(cfg config.Config) ConnectionInfo {
	info := ConnectionInfo{
		Host:            cfg.PostgresHost,
		Port:            cfg.PostgresPort,
		User:            cfg.PostgresUser,
		Database:        cfg.PostgresDB,
		SSLMode:         cfg.PostgresSSLMode,
		UsesDatabaseURL: cfg.UseDatabaseURL,
		PasswordLength:  len(cfg.PostgresPassword),
	}

	if !cfg.UseDatabaseURL {
		return info
	}

	parsedURL, err := url.Parse(cfg.DatabaseURL)
	if err != nil {
		return info
	}

	info.Host = parsedURL.Hostname()

	if parsedURL.Port() != "" {
		info.Port = parsedURL.Port()
	}

	if parsedURL.User != nil {
		info.User = parsedURL.User.Username()

		password, hasPassword := parsedURL.User.Password()
		if hasPassword {
			info.PasswordLength = len(password)
		} else {
			info.PasswordLength = 0
		}
	}

	if parsedURL.Path != "" {
		info.Database = strings.TrimPrefix(parsedURL.Path, "/")
	}

	if sslMode := parsedURL.Query().Get("sslmode"); sslMode != "" {
		info.SSLMode = sslMode
	}

	return info
}

func Connect(ctx context.Context, cfg config.Config) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(buildConnectionString(cfg))
	if err != nil {
		return nil, err
	}

	return pgxpool.NewWithConfig(ctx, poolConfig)
}

func Ping(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return errors.New("database pool is nil")
	}

	// Use a short timeout so the readiness check fails quickly.
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	return pool.Ping(pingCtx)
}

func Close(pool *pgxpool.Pool) {
	if pool != nil {
		pool.Close()
	}
}

func buildConnectionString(cfg config.Config) string {
	if cfg.UseDatabaseURL {
		return cfg.DatabaseURL
	}

	// Use a keyword/value connection string so we can force the exact host
	// without relying on URL parsing or localhost name resolution.
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		quoteConnStringValue(cfg.PostgresHost),
		quoteConnStringValue(cfg.PostgresPort),
		quoteConnStringValue(cfg.PostgresUser),
		quoteConnStringValue(cfg.PostgresPassword),
		quoteConnStringValue(cfg.PostgresDB),
		quoteConnStringValue(cfg.PostgresSSLMode),
	)
}

func quoteConnStringValue(value string) string {
	escapedValue := strings.ReplaceAll(value, `\`, `\\`)
	escapedValue = strings.ReplaceAll(escapedValue, `'`, `\'`)

	return "'" + escapedValue + "'"
}
