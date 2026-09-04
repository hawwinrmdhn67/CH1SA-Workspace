package notes

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, note *models.Note) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Note, error)
	List(ctx context.Context) ([]*models.Note, error)
	Update(ctx context.Context, note *models.Note) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(ctx context.Context, note *models.Note) error {
	query := `
		INSERT INTO notes (title, content, created_at, updated_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	now := time.Now()
	note.CreatedAt = now
	note.UpdatedAt = now

	err := database.Pool.QueryRow(ctx, query,
		note.Title,
		note.Content,
		note.CreatedAt,
		note.UpdatedAt,
	).Scan(&note.ID)

	if err != nil {
		return fmt.Errorf("failed to create note: %w", err)
	}
	return nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*models.Note, error) {
	query := `SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1`
	note := &models.Note{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&note.ID,
		&note.Title,
		&note.Content,
		&note.CreatedAt,
		&note.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get note: %w", err)
	}
	return note, nil
}

func (r *repository) List(ctx context.Context) ([]*models.Note, error) {
	query := `SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list notes: %w", err)
	}
	defer rows.Close()

	var notes []*models.Note
	for rows.Next() {
		note := &models.Note{}
		err := rows.Scan(
			&note.ID,
			&note.Title,
			&note.Content,
			&note.CreatedAt,
			&note.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}
		notes = append(notes, note)
	}
	return notes, nil
}

func (r *repository) Update(ctx context.Context, note *models.Note) error {
	query := `
		UPDATE notes
		SET title = $1, content = $2, updated_at = $3
		WHERE id = $4
	`
	note.UpdatedAt = time.Now()
	_, err := database.Pool.Exec(ctx, query,
		note.Title,
		note.Content,
		note.UpdatedAt,
		note.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update note: %w", err)
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM notes WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete note: %w", err)
	}
	return nil
}
