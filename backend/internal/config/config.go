package config

import (
	"bufio"
	"net/url"
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
}

func Load() Config {
	loadEnvFiles()

	port := getEnv("APP_PORT", "8080")
	host := getEnv("POSTGRES_HOST", "localhost")
	dbPort := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "devtodo")
	password := getEnv("POSTGRES_PASSWORD", "devtodo_password")
	databaseName := getEnv("POSTGRES_DB", "devtodo_db")
	sslMode := getEnv("POSTGRES_SSLMODE", "disable")
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		databaseURL = buildDatabaseURL(host, dbPort, user, password, databaseName, sslMode)
	}

	return Config{
		AppName:          "DevToDo",
		Port:             port,
		PostgresHost:     host,
		PostgresPort:     dbPort,
		PostgresUser:     user,
		PostgresPassword: password,
		PostgresDB:       databaseName,
		PostgresSSLMode:  sslMode,
		DatabaseURL:      databaseURL,
	}
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

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func buildDatabaseURL(host, port, user, password, databaseName, sslMode string) string {
	connectionURL := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   host + ":" + port,
		Path:   databaseName,
	}

	query := connectionURL.Query()
	query.Set("sslmode", sslMode)
	connectionURL.RawQuery = query.Encode()

	return connectionURL.String()
}
