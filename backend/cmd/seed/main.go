package main

import (
	"context"
	"log"

	"chisa-assistant-backend/internal/config"
	"chisa-assistant-backend/internal/database"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	
	config.LoadConfig()

	
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.CloseDB()

	ctx := context.Background()

	log.Println("Starting database seeding...")

	
	
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	var adminID string
	err = database.Pool.QueryRow(ctx, `
		INSERT INTO users (username, password_hash, role, is_active, must_change_password)
		VALUES ($1, $2, 'admin', true, false)
		ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = 'admin'
		RETURNING id
	`, "admin", string(hash)).Scan(&adminID)

	if err != nil {
		log.Fatalf("Failed to seed admin user: %v", err)
	}
	log.Printf("Admin user 'admin' seeded successfully with ID: %s", adminID)

	
	var folderID string
	err = database.Pool.QueryRow(ctx, `
		INSERT INTO folders (user_id, name)
		VALUES ($1, 'Documents')
		RETURNING id
	`, adminID).Scan(&folderID)
	if err != nil {
		log.Printf("Warning: Failed to seed folder: %v", err)
	} else {
		log.Printf("Folder 'Documents' seeded with ID: %s", folderID)
	}

	
	_, err = database.Pool.Exec(ctx, `
		INSERT INTO tasks (user_id, title, description, status, priority)
		VALUES ($1, 'Welcome to CH1SA Workspace', 'Explore features and customize your workspace.', 'backlog', 'None')
	`, adminID)
	if err != nil {
		log.Printf("Warning: Failed to seed task: %v", err)
	} else {
		log.Println("Welcome task seeded successfully.")
	}

	
	_, err = database.Pool.Exec(ctx, `
		INSERT INTO notes (user_id, title, content)
		VALUES ($1, 'Getting Started', 'Welcome to your workspace! This is your first note.')
	`, adminID)
	if err != nil {
		log.Printf("Warning: Failed to seed note: %v", err)
	} else {
		log.Println("Getting Started note seeded successfully.")
	}

	log.Println("Database seeding completed successfully!")
}
