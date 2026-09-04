package main

import (
	"log"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	m, err := migrate.New(
		"file://migrations",
		dbURL,
	)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}

	cmd := "up"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Migration up failed: %v", err)
		}
		log.Println("Successfully migrated database up")
	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("Migration down failed: %v", err)
		}
		log.Println("Successfully migrated database down")
	case "force":
		if len(os.Args) < 3 {
			log.Fatalf("force requires a version number")
		}
		v, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("invalid version: %v", err)
		}
		if err := m.Force(v); err != nil {
			log.Fatalf("Force failed: %v", err)
		}
		log.Println("Successfully forced version to", v)
	case "drop":
		if err := m.Drop(); err != nil {
			log.Fatalf("Drop failed: %v", err)
		}
		log.Println("Successfully dropped everything")
	default:
		log.Fatalf("Unknown command: %s (expected 'up', 'down', 'force', 'drop')", cmd)
	}
}
