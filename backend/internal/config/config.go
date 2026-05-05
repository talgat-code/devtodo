package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
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
	JWTSecret        string
}

func Load() Config {
	loadEnvFiles()

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
		JWTSecret:        getEnv("JWT_SECRET", "change_me_later"),
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

func loadEnvFiles() {
	candidates := []string{
		".env",
		".env.local",
		filepath.Join("..", ".env"),
		filepath.Join("..", ".env.local"),
	}

	for _, candidate := range candidates {
		loadEnvFile(candidate)
	}
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}

		key = strings.TrimSpace(strings.TrimPrefix(key, "export "))
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)

		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		_ = os.Setenv(key, value)
	}
}
