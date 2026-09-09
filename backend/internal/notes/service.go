package notes

import (
	"context"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateNote(ctx context.Context, userID uuid.UUID, note *models.Note) error
	GetNote(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Note, error)
	ListNotes(ctx context.Context, userID uuid.UUID) ([]*models.Note, error)
	UpdateNote(ctx context.Context, userID uuid.UUID, note *models.Note) error
	DeleteNote(ctx context.Context, userID uuid.UUID, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateNote(ctx context.Context, userID uuid.UUID, note *models.Note) error {
	return s.repo.Create(ctx, userID, note)
}

func (s *service) GetNote(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Note, error) {
	return s.repo.GetByID(ctx, userID, id)
}

func (s *service) ListNotes(ctx context.Context, userID uuid.UUID) ([]*models.Note, error) {
	return s.repo.List(ctx, userID)
}

func (s *service) UpdateNote(ctx context.Context, userID uuid.UUID, note *models.Note) error {
	return s.repo.Update(ctx, userID, note)
}

func (s *service) DeleteNote(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	return s.repo.Delete(ctx, userID, id)
}
