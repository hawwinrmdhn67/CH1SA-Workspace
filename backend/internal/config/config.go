package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv               string
	Port                 string
	NineRouterAPIKey     string
	NineRouterModel      string
	NineRouterBaseURL    string
	CORSOrigins          string
	AdminDefaultPassword string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	return &Config{
		AppEnv:               getEnv("APP_ENV", "development"),
		Port:                 getEnv("PORT", "8080"),
		NineRouterAPIKey:     getEnv("NINEROUTER_API_KEY", ""),
		NineRouterModel:      getEnv("NINEROUTER_MODEL", "my-combo"),
		NineRouterBaseURL:    getEnv("NINEROUTER_BASE_URL", "http://localhost:20128/v1"),
		CORSOrigins:          getEnv("CORS_ORIGINS", "http://localhost:3000"),
		AdminDefaultPassword: getEnv("ADMIN_DEFAULT_PASSWORD", "admin123"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
