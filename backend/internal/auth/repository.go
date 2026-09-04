package auth

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
	GetFirstUser(ctx context.Context) (*models.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, newPasswordHash string) error
	UpdateRecoveryCode(ctx context.Context, userID uuid.UUID, code string) error
	CreateSession(ctx context.Context, session *models.Session) error
	GetSession(ctx context.Context, id uuid.UUID) (*models.Session, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetFirstUser(ctx context.Context) (*models.User, error) {
	query := `SELECT id, display_name, password_hash, recovery_code, created_at, updated_at FROM users LIMIT 1`
	user := &models.User{}
	err := database.Pool.QueryRow(ctx, query).Scan(
		&user.ID, &user.DisplayName, &user.PasswordHash, &user.RecoveryCode, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *repository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `SELECT id, display_name, password_hash, recovery_code, created_at, updated_at FROM users WHERE id = $1`
	user := &models.User{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.DisplayName, &user.PasswordHash, &user.RecoveryCode, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *repository) CreateUser(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (display_name, password_hash, recovery_code, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	err := database.Pool.QueryRow(ctx, query, user.DisplayName, user.PasswordHash, user.RecoveryCode, user.CreatedAt, user.UpdatedAt).Scan(&user.ID)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *repository) UpdatePassword(ctx context.Context, userID uuid.UUID, newPasswordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`
	_, err := database.Pool.Exec(ctx, query, newPasswordHash, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}

func (r *repository) UpdateRecoveryCode(ctx context.Context, userID uuid.UUID, code string) error {
	query := `UPDATE users SET recovery_code = $1, updated_at = $2 WHERE id = $3`
	_, err := database.Pool.Exec(ctx, query, code, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update recovery code: %w", err)
	}
	return nil
}

func (r *repository) CreateSession(ctx context.Context, session *models.Session) error {
	query := `
		INSERT INTO sessions (user_id, expires_at, created_at)
		VALUES ($1, $2, $3)
		RETURNING id
	`
	session.CreatedAt = time.Now()
	err := database.Pool.QueryRow(ctx, query, session.UserID, session.ExpiresAt, session.CreatedAt).Scan(&session.ID)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	return nil
}

func (r *repository) GetSession(ctx context.Context, id uuid.UUID) (*models.Session, error) {
	query := `SELECT id, user_id, expires_at, created_at FROM sessions WHERE id = $1`
	session := &models.Session{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&session.ID, &session.UserID, &session.ExpiresAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *repository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM sessions WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	return err
}
