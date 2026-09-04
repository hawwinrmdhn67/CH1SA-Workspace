package notes

import (
	"context"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateNote(ctx context.Context, note *models.Note) error
	GetNote(ctx context.Context, id uuid.UUID) (*models.Note, error)
	ListNotes(ctx context.Context) ([]*models.Note, error)
	UpdateNote(ctx context.Context, note *models.Note) error
	DeleteNote(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateNote(ctx context.Context, note *models.Note) error {
	return s.repo.Create(ctx, note)
}

func (s *service) GetNote(ctx context.Context, id uuid.UUID) (*models.Note, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListNotes(ctx context.Context) ([]*models.Note, error) {
	return s.repo.List(ctx)
}

func (s *service) UpdateNote(ctx context.Context, note *models.Note) error {
	return s.repo.Update(ctx, note)
}

func (s *service) DeleteNote(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
