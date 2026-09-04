package calendar

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, event *models.CalendarEvent) error
	List(ctx context.Context) ([]*models.CalendarEvent, error)
	Get(ctx context.Context, id uuid.UUID) (*models.CalendarEvent, error)
	Update(ctx context.Context, event *models.CalendarEvent) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(ctx context.Context, event *models.CalendarEvent) error {
	query := `
		INSERT INTO calendar_events (title, description, date, start_time, end_time, all_day, calendar, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now

	err := database.Pool.QueryRow(ctx, query,
		event.Title,
		event.Description,
		event.Date,
		event.StartTime,
		event.EndTime,
		event.AllDay,
		event.Calendar,
		event.CreatedAt,
		event.UpdatedAt,
	).Scan(&event.ID)

	if err != nil {
		return fmt.Errorf("failed to create event: %w", err)
	}
	return nil
}

func (r *repository) List(ctx context.Context) ([]*models.CalendarEvent, error) {
	query := `
		SELECT id, title, description, date::text, start_time::text, end_time::text, all_day, calendar, created_at, updated_at
		FROM calendar_events
		ORDER BY date ASC, start_time ASC
	`
	rows, err := database.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}
	defer rows.Close()

	var events []*models.CalendarEvent
	for rows.Next() {
		event := &models.CalendarEvent{}
		err := rows.Scan(
			&event.ID,
			&event.Title,
			&event.Description,
			&event.Date,
			&event.StartTime,
			&event.EndTime,
			&event.AllDay,
			&event.Calendar,
			&event.CreatedAt,
			&event.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}
	return events, nil
}

func (r *repository) Get(ctx context.Context, id uuid.UUID) (*models.CalendarEvent, error) {
	query := `
		SELECT id, title, description, date::text, start_time::text, end_time::text, all_day, calendar, created_at, updated_at
		FROM calendar_events
		WHERE id = $1
	`
	event := &models.CalendarEvent{}
	err := database.Pool.QueryRow(ctx, query, id).Scan(
		&event.ID,
		&event.Title,
		&event.Description,
		&event.Date,
		&event.StartTime,
		&event.EndTime,
		&event.AllDay,
		&event.Calendar,
		&event.CreatedAt,
		&event.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	return event, nil
}

func (r *repository) Update(ctx context.Context, event *models.CalendarEvent) error {
	query := `
		UPDATE calendar_events
		SET title = $1, description = $2, date = $3, start_time = $4, end_time = $5, all_day = $6, calendar = $7, updated_at = $8
		WHERE id = $9
	`
	event.UpdatedAt = time.Now()
	_, err := database.Pool.Exec(ctx, query,
		event.Title,
		event.Description,
		event.Date,
		event.StartTime,
		event.EndTime,
		event.AllDay,
		event.Calendar,
		event.UpdatedAt,
		event.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update event: %w", err)
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM calendar_events WHERE id = $1`
	_, err := database.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}
	return nil
}
