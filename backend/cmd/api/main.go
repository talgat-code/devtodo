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

	dbPool, err := database.NewPool(ctx, cfg)
	if err != nil {
		log.Fatalf("could not create database pool: %v", err)
	}
	defer dbPool.Close()

	if err := database.Ping(ctx, dbPool); err != nil {
		log.Printf("database not ready: %v", err)
	}

	r := router.SetupRouter(cfg.AppName, dbPool)

	log.Printf("starting %s on port %s", cfg.AppName, cfg.Port)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
