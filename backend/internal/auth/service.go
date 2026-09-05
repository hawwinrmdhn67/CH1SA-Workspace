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
	Login(ctx context.Context, password string) (*models.Session, error)
	Logout(ctx context.Context, sessionID uuid.UUID) error
	ValidateSession(ctx context.Context, sessionID uuid.UUID) (*models.User, error)
	Register(ctx context.Context, displayName, password string) error
	ResetPassword(ctx context.Context, recoveryCode, newPassword string) error
	GetRecoveryCode(ctx context.Context) (string, error)
	RegenerateRecoveryCode(ctx context.Context) (string, error)
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

func (s *service) Register(ctx context.Context, displayName, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	code := generateRecoveryCode()

	user := &models.User{
		DisplayName:  displayName,
		PasswordHash: string(hash),
		RecoveryCode: &code,
	}

	return s.repo.CreateUser(ctx, user)
}

func (s *service) ResetPassword(ctx context.Context, recoveryCode, newPassword string) error {
	user, err := s.repo.GetFirstUser(ctx)
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

func (s *service) GetRecoveryCode(ctx context.Context) (string, error) {
	user, err := s.repo.GetFirstUser(ctx)
	if err != nil {
		return "", errors.New("no user found")
	}
	if user.RecoveryCode == nil {
		return "", errors.New("no recovery code found")
	}
	return *user.RecoveryCode, nil
}

func (s *service) RegenerateRecoveryCode(ctx context.Context) (string, error) {
	user, err := s.repo.GetFirstUser(ctx)
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

func (s *service) Login(ctx context.Context, password string) (*models.Session, error) {
	user, err := s.repo.GetFirstUser(ctx)
	if err != nil {
		if err := s.Register(ctx, "Hawwin Ramadhan", "password"); err != nil {
			return nil, errors.New("failed to initialize workspace user")
		}
		user, _ = s.repo.GetFirstUser(ctx)
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

	return s.repo.GetUserByID(ctx, session.UserID)
}
