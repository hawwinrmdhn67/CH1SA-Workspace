package main

import (
	"context"
	"flag"
	"log"
	"os"

	"chisa-assistant-backend/internal/auth"
	"chisa-assistant-backend/internal/config"
	"chisa-assistant-backend/internal/database"

	"golang.org/x/crypto/bcrypt"
)

func seedAdmin(ctx context.Context) {
	log.Println("Starting admin user seeding...")

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	recoveryCode := auth.GenerateRecoveryCode()

	var adminID string
	var finalRecoveryCode string
	err = database.Pool.QueryRow(ctx, `
		INSERT INTO users (username, password_hash, recovery_code, role, is_active, must_change_password)
		VALUES ($1, $2, $3, 'admin', true, false)
		ON CONFLICT (username) DO UPDATE SET 
			password_hash = $2, 
			role = 'admin',
			recovery_code = COALESCE(users.recovery_code, EXCLUDED.recovery_code)
		RETURNING id, recovery_code
	`, "admin", string(hash), recoveryCode).Scan(&adminID, &finalRecoveryCode)

	if err != nil {
		log.Fatalf("Failed to seed admin user: %v", err)
	}
	log.Printf("Admin user 'admin' seeded successfully with ID: %s", adminID)
	log.Printf("=================================================================")
	log.Printf("Admin Recovery Code: %s", finalRecoveryCode)
	log.Printf("Save this recovery code to reset password if credentials are lost.")
	log.Printf("=================================================================")
}

func seedTables(ctx context.Context) {
	log.Println("Starting tables data seeding...")

	var adminID string
	err := database.Pool.QueryRow(ctx, "SELECT id FROM users WHERE username = 'admin'").Scan(&adminID)
	if err != nil {
		log.Fatalf("Admin user not found. Please run with -admin flag first.")
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

	log.Println("Tables data seeding completed successfully!")
}

func main() {
	adminFlag := flag.Bool("admin", false, "Seed admin user")
	tablesFlag := flag.Bool("tables", false, "Seed tables data")
	allFlag := flag.Bool("all", false, "Seed both admin and tables data")

	flag.Parse()

	
	if !*adminFlag && !*tablesFlag && !*allFlag {
		log.Println("Gunakan flag argumen untuk menjalankan seeder:")
		flag.Usage()
		os.Exit(1)
	}

	
	config.LoadConfig()
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.CloseDB()

	ctx := context.Background()

	
	if *allFlag || *adminFlag {
		seedAdmin(ctx)
	}

	if *allFlag || *tablesFlag {
		seedTables(ctx)
	}

	log.Println("Seeding process finished.")
}
