package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"devtodo/internal/config"
	"devtodo/internal/database"

	"github.com/jackc/pgx/v5/pgxpool"
)

const createSchemaMigrationsTableQuery = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT now()
);
`

func main() {
	log.SetFlags(0)

	if len(os.Args) != 2 || os.Args[1] != "up" {
		log.Fatal("usage: go run ./cmd/migrate up")
	}

	ctx := context.Background()
	cfg := config.Load()

	log.Printf("connecting to database")

	pool, err := database.OpenPool(ctx, cfg)
	if err != nil {
		log.Fatalf("could not connect to database: %v", err)
	}
	defer pool.Close()

	migrationsDir, err := findMigrationsDir()
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("using migrations directory: %s", migrationsDir)

	if err := ensureSchemaMigrationsTable(ctx, pool); err != nil {
		log.Fatalf("could not prepare schema_migrations table: %v", err)
	}

	appliedMigrations, err := loadAppliedMigrations(ctx, pool)
	if err != nil {
		log.Fatalf("could not load applied migrations: %v", err)
	}

	migrationFiles, err := listUpMigrationFiles(migrationsDir)
	if err != nil {
		log.Fatalf("could not list migration files: %v", err)
	}

	if len(migrationFiles) == 0 {
		log.Println("no up migrations found")
		return
	}

	appliedCount := 0

	for _, migrationPath := range migrationFiles {
		filename := filepath.Base(migrationPath)

		if _, alreadyApplied := appliedMigrations[filename]; alreadyApplied {
			log.Printf("skip %s (already applied)", filename)
			continue
		}

		log.Printf("apply %s", filename)

		if err := applyMigration(ctx, pool, migrationPath, filename); err != nil {
			log.Fatalf("could not apply %s: %v", filename, err)
		}

		appliedCount++
		log.Printf("applied %s", filename)
	}

	if appliedCount == 0 {
		log.Println("database is already up to date")
		return
	}

	log.Printf("migration run complete (%d applied)", appliedCount)
}

func findMigrationsDir() (string, error) {
	candidates := []string{
		"migrations",
		filepath.Join("backend", "migrations"),
	}

	for _, candidate := range candidates {
		info, err := os.Stat(candidate)
		if err == nil && info.IsDir() {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("could not find migrations directory")
}

func ensureSchemaMigrationsTable(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, createSchemaMigrationsTableQuery)
	return err
}

func loadAppliedMigrations(ctx context.Context, pool *pgxpool.Pool) (map[string]struct{}, error) {
	rows, err := pool.Query(ctx, `SELECT filename FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	appliedMigrations := make(map[string]struct{})

	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}

		appliedMigrations[filename] = struct{}{}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return appliedMigrations, nil
}

func listUpMigrationFiles(migrationsDir string) ([]string, error) {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return nil, err
	}

	var files []string

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if strings.HasSuffix(entry.Name(), ".up.sql") {
			files = append(files, filepath.Join(migrationsDir, entry.Name()))
		}
	}

	sort.Strings(files)

	return files, nil
}

func applyMigration(ctx context.Context, pool *pgxpool.Pool, migrationPath, filename string) error {
	sqlBytes, err := os.ReadFile(migrationPath)
	if err != nil {
		return err
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (filename) VALUES ($1)`, filename); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}
