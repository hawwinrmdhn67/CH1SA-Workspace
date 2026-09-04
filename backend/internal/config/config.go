package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
)

type Config struct {
	Port          string
	GroqAPIKey    string
	GroqModel     string
	AllowedOrigin string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	return &Config{
		Port:          getEnv("PORT", "8080"),
		GroqAPIKey:    getEnv("GROQ_API_KEY", ""),
		GroqModel:     getEnv("GROQ_MODEL", "openai/gpt-oss-120b"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
