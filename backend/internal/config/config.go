package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Config struct {
	Port              string
	NineRouterAPIKey  string
	NineRouterModel   string
	NineRouterBaseURL string
	CORSOrigins       string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	return &Config{
		Port:              getEnv("PORT", "8080"),
		NineRouterAPIKey:  getEnv("NINEROUTER_API_KEY", ""),
		NineRouterModel:   getEnv("NINEROUTER_MODEL", "my-combo"),
		NineRouterBaseURL: getEnv("NINEROUTER_BASE_URL", "http://localhost:20128/v1"),
		CORSOrigins:       getEnv("CORS_ORIGINS", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
