package files

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
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

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateFolder(ctx context.Context, folder *models.Folder) error {
	query := `
		INSERT INTO folders (name, parent_folder_id, is_starred, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	now := time.Now()
	folder.CreatedAt = now
	folder.UpdatedAt = now

	err := database.Pool.QueryRow(ctx, query,
		folder.Name,
		folder.ParentID,
		folder.IsStarred,
		folder.CreatedAt,
		folder.UpdatedAt,
	).Scan(&folder.ID)

	if err != nil {
		return fmt.Errorf("failed to create folder: %w", err)
	}
	return nil
}

func (r *repository) GetFolder(ctx context.Context, id uuid.UUID) (*models.Folder, error) {
	query := `SELECT id, name, parent_folder_id, is_starred, created_at, updated_at FROM folders WHERE id = $1`
	folder := &models.Folder{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&folder.ID,
		&folder.Name,
		&folder.ParentID,
		&folder.IsStarred,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}
	return folder, nil
}

func (r *repository) ListFolders(ctx context.Context) ([]*models.Folder, error) {
	query := `SELECT id, name, parent_folder_id, is_starred, created_at, updated_at FROM folders ORDER BY name ASC`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}
	defer rows.Close()

	var folders []*models.Folder
	for rows.Next() {
		folder := &models.Folder{}
		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&folder.ParentID,
			&folder.IsStarred,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, folder)
	}
	return folders, nil
}

func (r *repository) UpdateFolder(ctx context.Context, folder *models.Folder) error {
	query := `
		UPDATE folders
		SET name = $1, parent_folder_id = $2, is_starred = $3, updated_at = $4
		WHERE id = $5
	`
	folder.UpdatedAt = time.Now()
	_, err := database.Pool.Exec(ctx, query,
		folder.Name,
		folder.ParentID,
		folder.IsStarred,
		folder.UpdatedAt,
		folder.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update folder: %w", err)
	}
	return nil
}

func (r *repository) DeleteFolder(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM folders WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}
	return nil
}

func (r *repository) CreateFile(ctx context.Context, file *models.File) error {
	query := `
		INSERT INTO files (id, name, folder_id, kind, size, is_starred, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`
	now := time.Now()
	file.CreatedAt = now
	file.UpdatedAt = now

	if file.ID == uuid.Nil {
		file.ID = uuid.New()
	}

	err := database.Pool.QueryRow(ctx, query,
		file.ID,
		file.Name,
		file.FolderID,
		file.Kind,
		file.Size,
		file.IsStarred,
		file.CreatedAt,
		file.UpdatedAt,
	).Scan(&file.ID)

	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	return nil
}

func (r *repository) GetFile(ctx context.Context, id uuid.UUID) (*models.File, error) {
	query := `SELECT id, name, folder_id, kind, size, is_starred, created_at, updated_at FROM files WHERE id = $1`
	file := &models.File{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&file.ID,
		&file.Name,
		&file.FolderID,
		&file.Kind,
		&file.Size,
		&file.IsStarred,
		&file.CreatedAt,
		&file.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get file: %w", err)
	}
	return file, nil
}

func (r *repository) ListFiles(ctx context.Context) ([]*models.File, error) {
	query := `SELECT id, name, folder_id, kind, size, is_starred, created_at, updated_at FROM files ORDER BY name ASC`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		file := &models.File{}
		err := rows.Scan(
			&file.ID,
			&file.Name,
			&file.FolderID,
			&file.Kind,
			&file.Size,
			&file.IsStarred,
			&file.CreatedAt,
			&file.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}
		files = append(files, file)
	}
	return files, nil
}

func (r *repository) UpdateFile(ctx context.Context, file *models.File) error {
	query := `
		UPDATE files
		SET name = $1, folder_id = $2, is_starred = $3, updated_at = $4
		WHERE id = $5
	`
	file.UpdatedAt = time.Now()
	_, err := database.Pool.Exec(ctx, query,
		file.Name,
		file.FolderID,
		file.IsStarred,
		file.UpdatedAt,
		file.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update file: %w", err)
	}
	return nil
}

func (r *repository) DeleteFile(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM files WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}
