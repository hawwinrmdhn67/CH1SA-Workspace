package admin

import (
	"context"
	"errors"
	"strings"

	"chisa-assistant-backend/internal/auth"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	ListUsers(ctx context.Context) ([]*models.User, error)
	CreateUser(ctx context.Context, username, password, role string) error
	UpdateUser(ctx context.Context, targetUserID uuid.UUID, username, role string, isActive bool) error
	DeleteUser(ctx context.Context, targetUserID uuid.UUID) error
	ForceResetPassword(ctx context.Context, targetUserID uuid.UUID, newPassword string, mustChangePassword bool) error
}

type service struct {
	repo        Repository
	authService auth.Service
}

func NewService(repo Repository, authService auth.Service) Service {
	return &service{repo: repo, authService: authService}
}

func (s *service) ListUsers(ctx context.Context) ([]*models.User, error) {
	return s.repo.ListUsers(ctx)
}

func (s *service) CreateUser(ctx context.Context, username, password, role string) error {
	// Ensure roles are valid
	if role != "admin" && role != "user" {
		return errors.New("invalid role")
	}
	
	// Create user via auth service, with mustChangePassword = false
	return s.authService.Register(ctx, username, password, role, false)
}

func (s *service) UpdateUser(ctx context.Context, targetUserID uuid.UUID, username, role string, isActive bool) error {
	username = strings.ToLower(strings.TrimSpace(username))
	if username == "" {
		return errors.New("username cannot be empty")
	}

	if role != "admin" && role != "user" {
		return errors.New("invalid role")
	}

	// Check if username is already in use by another user
	exists, err := s.repo.CheckUsernameExists(ctx, username, targetUserID)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("username is already in use")
	}

	// Prevent removing the last active admin
	if role != "admin" || !isActive {
		count, err := s.repo.CountActiveAdmins(ctx)
		if err != nil {
			return err
		}
		
		// If there is only 1 admin left, we must ensure we are not modifying them
		if count <= 1 {
			users, err := s.repo.ListUsers(ctx)
			if err == nil {
				for _, u := range users {
					if u.ID == targetUserID && u.Role == "admin" && u.IsActive {
						return errors.New("cannot demote or deactivate the last active administrator")
					}
				}
			}
		}
	}

	return s.repo.UpdateUser(ctx, targetUserID, username, role, isActive)
}

func (s *service) DeleteUser(ctx context.Context, targetUserID uuid.UUID) error {
	count, err := s.repo.CountActiveAdmins(ctx)
	if err != nil {
		return err
	}
	
	if count <= 1 {
		users, err := s.repo.ListUsers(ctx)
		if err == nil {
			for _, u := range users {
				if u.ID == targetUserID && u.Role == "admin" && u.IsActive {
					return errors.New("cannot delete the last active administrator")
				}
			}
		}
	}
	return s.repo.DeleteUser(ctx, targetUserID)
}

func (s *service) ForceResetPassword(ctx context.Context, targetUserID uuid.UUID, newPassword string, mustChangePassword bool) error {
	return s.authService.ForceResetPassword(ctx, targetUserID, newPassword, mustChangePassword)
}
