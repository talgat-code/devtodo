package config

import (
	"os"
)

type Config struct {
	AppName          string
	Port             string
	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresSSLMode  string
	DatabaseURL      string
	UseDatabaseURL   bool
}

func Load() Config {
	postgresHost := getEnv("POSTGRES_HOST", "127.0.0.1")
	postgresPort := getEnv("POSTGRES_PORT", "15433")
	postgresUser := getEnv("POSTGRES_USER", "devtodo")
	postgresPassword := getEnv("POSTGRES_PASSWORD", "devtodo_password")
	postgresDB := getEnv("POSTGRES_DB", "devtodo_db")
	postgresSSLMode := getEnv("POSTGRES_SSLMODE", "disable")
	databaseURL, useDatabaseURL := getOptionalEnv("DATABASE_URL")

	return Config{
		AppName:          "DevToDo",
		Port:             getEnv("APP_PORT", "8080"),
		PostgresHost:     postgresHost,
		PostgresPort:     postgresPort,
		PostgresUser:     postgresUser,
		PostgresPassword: postgresPassword,
		PostgresDB:       postgresDB,
		PostgresSSLMode:  postgresSSLMode,
		DatabaseURL:      databaseURL,
		UseDatabaseURL:   useDatabaseURL,
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func getOptionalEnv(key string) (string, bool) {
	value := os.Getenv(key)
	if value == "" {
		return "", false
	}

	return value, true
}
