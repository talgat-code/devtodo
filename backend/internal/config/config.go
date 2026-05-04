package config

import "os"

type Config struct {
	AppName string
	Port    string
}

func Load() Config {
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		AppName: "DevToDo",
		Port:    port,
	}
}
