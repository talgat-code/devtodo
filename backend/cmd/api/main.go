package main

import (
	"context"
	"log"

	"devtodo/internal/config"
	"devtodo/internal/database"
	"devtodo/internal/router"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	connectionInfo := database.DescribeConnection(cfg)

	log.Printf(
		"database config: host=%s port=%s user=%s database=%s sslmode=%s use_database_url=%t password_length=%d",
		connectionInfo.Host,
		connectionInfo.Port,
		connectionInfo.User,
		connectionInfo.Database,
		connectionInfo.SSLMode,
		connectionInfo.UsesDatabaseURL,
		connectionInfo.PasswordLength,
	)

	dbPool, err := database.Connect(ctx, cfg)
	if err != nil {
		log.Fatalf("failed to create PostgreSQL pool: %v", err)
	}
	defer database.Close(dbPool)

	if err := database.Ping(ctx, dbPool); err != nil {
		log.Printf("PostgreSQL is not ready yet: %v", err)
	} else {
		log.Printf("connected to PostgreSQL")
	}

	r := router.SetupRouter(cfg.AppName, dbPool, cfg.JWTSecret)

	log.Printf("starting %s on port %s", cfg.AppName, cfg.Port)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
