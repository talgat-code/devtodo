package main

import (
	"log"

	"devtodo/internal/config"
	"devtodo/internal/router"
)

func main() {
	cfg := config.Load()
	r := router.SetupRouter(cfg.AppName)

	log.Printf("starting %s on port %s", cfg.AppName, cfg.Port)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
