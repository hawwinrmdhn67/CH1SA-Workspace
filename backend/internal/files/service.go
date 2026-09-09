package files

import (
	"context"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateFolder(ctx context.Context, userID uuid.UUID, folder *models.Folder) error
	GetFolder(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Folder, error)
	ListFolders(ctx context.Context, userID uuid.UUID) ([]*models.Folder, error)
	UpdateFolder(ctx context.Context, userID uuid.UUID, folder *models.Folder) error
	DeleteFolder(ctx context.Context, userID uuid.UUID, id uuid.UUID) error

	CreateFile(ctx context.Context, userID uuid.UUID, file *models.File) error
	GetFile(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.File, error)
	ListFiles(ctx context.Context, userID uuid.UUID) ([]*models.File, error)
	UpdateFile(ctx context.Context, userID uuid.UUID, file *models.File) error
	DeleteFile(ctx context.Context, userID uuid.UUID, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateFolder(ctx context.Context, userID uuid.UUID, folder *models.Folder) error {
	return s.repo.CreateFolder(ctx, userID, folder)
}

func (s *service) GetFolder(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Folder, error) {
	return s.repo.GetFolder(ctx, userID, id)
}

func (s *service) ListFolders(ctx context.Context, userID uuid.UUID) ([]*models.Folder, error) {
	return s.repo.ListFolders(ctx, userID)
}

func (s *service) UpdateFolder(ctx context.Context, userID uuid.UUID, folder *models.Folder) error {
	return s.repo.UpdateFolder(ctx, userID, folder)
}

func (s *service) DeleteFolder(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	return s.repo.DeleteFolder(ctx, userID, id)
}

func (s *service) CreateFile(ctx context.Context, userID uuid.UUID, file *models.File) error {
	return s.repo.CreateFile(ctx, userID, file)
}

func (s *service) GetFile(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.File, error) {
	return s.repo.GetFile(ctx, userID, id)
}

func (s *service) ListFiles(ctx context.Context, userID uuid.UUID) ([]*models.File, error) {
	return s.repo.ListFiles(ctx, userID)
}

func (s *service) UpdateFile(ctx context.Context, userID uuid.UUID, file *models.File) error {
	return s.repo.UpdateFile(ctx, userID, file)
}

func (s *service) DeleteFile(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	return s.repo.DeleteFile(ctx, userID, id)
}
