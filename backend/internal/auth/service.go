package auth

import (
	"context"
	"crypto/rand"
	"errors"
	"strings"
	"time"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Login(ctx context.Context, username, password string) (*models.Session, error)
	Logout(ctx context.Context, sessionID uuid.UUID) error
	ValidateSession(ctx context.Context, sessionID uuid.UUID) (*models.User, error)
	Register(ctx context.Context, username, displayName, password, role string, mustChangePassword bool) error
	ResetPassword(ctx context.Context, username, recoveryCode, newPassword string) error
	GetRecoveryCode(ctx context.Context, userID uuid.UUID) (string, error)
	RegenerateRecoveryCode(ctx context.Context, userID uuid.UUID) (string, error)
	VerifyRecoveryCode(ctx context.Context, recoveryCode string) (string, error)
	UpdateUsername(ctx context.Context, userID uuid.UUID, newUsername string) error
	ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	ForceResetPassword(ctx context.Context, userID uuid.UUID, newPassword string, mustChangePassword bool) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func generateRecoveryCode() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 16)
	
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		panic("crypto/rand failed to generate secure random bytes")
	}

	for i := range b {
		b[i] = charset[randomBytes[i]%byte(len(charset))]
	}
	
	return string(b[0:4]) + "-" + string(b[4:8]) + "-" + string(b[8:12]) + "-" + string(b[12:16])
}

func isBuggyOldCode(code string) bool {
	if len(code) != 19 {
		return true
	}
	firstChar := code[0]
	for i := 0; i < len(code); i++ {
		if i == 4 || i == 9 || i == 14 {
			continue
		}
		if code[i] != firstChar {
			return false
		}
	}
	return true
}

func (s *service) Register(ctx context.Context, username, displayName, password, role string, mustChangePassword bool) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	code := generateRecoveryCode()

	user := &models.User{
		Username:           username,
		DisplayName:        displayName,
		PasswordHash:       string(hash),
		RecoveryCode:       &code,
		Role:               role,
		IsActive:           true,
		MustChangePassword: mustChangePassword,
	}

	return s.repo.CreateUser(ctx, user)
}

func (s *service) ResetPassword(ctx context.Context, username, recoveryCode, newPassword string) error {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return errors.New("no user found to reset password for")
	}

	if user.RecoveryCode == nil || isBuggyOldCode(*user.RecoveryCode) {
		return errors.New("invalid recovery code")
	}

	storedCodeNormalized := strings.ToUpper(strings.ReplaceAll(*user.RecoveryCode, "-", ""))
	inputCodeNormalized := strings.ToUpper(strings.ReplaceAll(recoveryCode, "-", ""))

	if storedCodeNormalized != inputCodeNormalized {
		return errors.New("invalid recovery code")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, user.ID, string(hash))
}

func (s *service) GetRecoveryCode(ctx context.Context, userID uuid.UUID) (string, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return "", errors.New("no user found")
	}
	if user.RecoveryCode == nil {
		return "", errors.New("no recovery code found")
	}
	return *user.RecoveryCode, nil
}

func (s *service) RegenerateRecoveryCode(ctx context.Context, userID uuid.UUID) (string, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return "", errors.New("no user found")
	}

	newCode := generateRecoveryCode()
	err = s.repo.UpdateRecoveryCode(ctx, user.ID, newCode)
	if err != nil {
		return "", err
	}
	return newCode, nil
}

func (s *service) VerifyRecoveryCode(ctx context.Context, recoveryCode string) (string, error) {
	inputCodeNormalized := strings.ToUpper(strings.ReplaceAll(recoveryCode, "-", ""))
	if inputCodeNormalized == "" {
		return "", errors.New("invalid recovery code")
	}

	user, err := s.repo.GetUserByRecoveryCode(ctx, inputCodeNormalized)
	if err != nil {
		return "", errors.New("invalid recovery code")
	}
	
	if user.RecoveryCode == nil || isBuggyOldCode(*user.RecoveryCode) {
		return "", errors.New("invalid recovery code")
	}
	
	return user.Username, nil
}

func (s *service) Login(ctx context.Context, username, password string) (*models.Session, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if username == "admin" {
			_, checkErr := s.repo.GetFirstUser(ctx)
			if checkErr != nil {
				if err := s.Register(ctx, "admin", "Admin", "admin123", "admin", false); err != nil {
					return nil, errors.New("failed to initialize workspace user")
				}
				user, _ = s.repo.GetUserByUsername(ctx, "admin")
			} else {
				return nil, errors.New("invalid username or password")
			}
		} else {
			return nil, errors.New("invalid username or password")
		}
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid password")
	}

	if user.RecoveryCode != nil && isBuggyOldCode(*user.RecoveryCode) {
		newCode := generateRecoveryCode()
		_ = s.repo.UpdateRecoveryCode(ctx, user.ID, newCode)
	}

	session := &models.Session{
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *service) Logout(ctx context.Context, sessionID uuid.UUID) error {
	return s.repo.DeleteSession(ctx, sessionID)
}

func (s *service) ValidateSession(ctx context.Context, sessionID uuid.UUID) (*models.User, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, errors.New("invalid session")
	}

	if time.Now().After(session.ExpiresAt) {
		_ = s.repo.DeleteSession(ctx, sessionID)
		return nil, errors.New("session expired")
	}

	user, err := s.repo.GetUserByID(ctx, session.UserID)
	if err != nil || !user.IsActive {
		return nil, errors.New("user not found or deactivated")
	}
	return user, nil
}

func (s *service) UpdateUsername(ctx context.Context, userID uuid.UUID, newUsername string) error {
	newUsername = strings.ToLower(strings.TrimSpace(newUsername))
	if newUsername == "" {
		return errors.New("username cannot be empty")
	}
	return s.repo.UpdateUsername(ctx, userID, newUsername)
}

func (s *service) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}
	
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("invalid current password")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.UpdatePassword(ctx, userID, string(hash))
}

func (s *service) ForceResetPassword(ctx context.Context, userID uuid.UUID, newPassword string, mustChangePassword bool) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = s.repo.ForceUpdatePassword(ctx, userID, string(hash), mustChangePassword)
	if err != nil {
		return err
	}
	
	return nil
}
