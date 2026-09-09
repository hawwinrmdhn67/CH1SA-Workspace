package admin

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
	ListUsers(ctx context.Context) ([]*models.User, error)
	UpdateUser(ctx context.Context, userID uuid.UUID, displayName, role string, isActive bool) error
	DeleteUser(ctx context.Context, userID uuid.UUID) error
	CountActiveAdmins(ctx context.Context) (int, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) ListUsers(ctx context.Context) ([]*models.User, error) {
	query := `SELECT id, username, display_name, role, is_active, must_change_password, created_at, updated_at FROM users ORDER BY created_at ASC`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		if err := rows.Scan(&user.ID, &user.Username, &user.DisplayName, &user.Role, &user.IsActive, &user.MustChangePassword, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *repository) UpdateUser(ctx context.Context, userID uuid.UUID, displayName, role string, isActive bool) error {
	query := `UPDATE users SET display_name = $1, role = $2, is_active = $3, updated_at = $4 WHERE id = $5`
	_, err := database.Pool.Exec(ctx, query, displayName, role, isActive, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

func (r *repository) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, userID)
	return err
}

func (r *repository) CountActiveAdmins(ctx context.Context) (int, error) {
	query := `SELECT count(*) FROM users WHERE role = 'admin' AND is_active = true`
	var count int
	err := database.Pool.QueryRow(ctx, query).Scan(&count)
	return count, err
}
