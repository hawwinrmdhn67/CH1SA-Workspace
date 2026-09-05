package files

import (
	"context"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateFolder(ctx context.Context, folder *models.Folder) error
	GetFolder(ctx context.Context, id uuid.UUID) (*models.Folder, error)
	ListFolders(ctx context.Context) ([]*models.Folder, error)
	UpdateFolder(ctx context.Context, folder *models.Folder) error
	DeleteFolder(ctx context.Context, id uuid.UUID) error

	CreateFile(ctx context.Context, file *models.File) error
	GetFile(ctx context.Context, id uuid.UUID) (*models.File, error)
	ListFiles(ctx context.Context) ([]*models.File, error)
	UpdateFile(ctx context.Context, file *models.File) error
	DeleteFile(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateFolder(ctx context.Context, folder *models.Folder) error {
	return s.repo.CreateFolder(ctx, folder)
}

func (s *service) GetFolder(ctx context.Context, id uuid.UUID) (*models.Folder, error) {
	return s.repo.GetFolder(ctx, id)
}

func (s *service) ListFolders(ctx context.Context) ([]*models.Folder, error) {
	return s.repo.ListFolders(ctx)
}

func (s *service) UpdateFolder(ctx context.Context, folder *models.Folder) error {
	return s.repo.UpdateFolder(ctx, folder)
}

func (s *service) DeleteFolder(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteFolder(ctx, id)
}

func (s *service) CreateFile(ctx context.Context, file *models.File) error {
	return s.repo.CreateFile(ctx, file)
}

func (s *service) GetFile(ctx context.Context, id uuid.UUID) (*models.File, error) {
	return s.repo.GetFile(ctx, id)
}

func (s *service) ListFiles(ctx context.Context) ([]*models.File, error) {
	return s.repo.ListFiles(ctx)
}

func (s *service) UpdateFile(ctx context.Context, file *models.File) error {
	return s.repo.UpdateFile(ctx, file)
}

func (s *service) DeleteFile(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteFile(ctx, id)
}
