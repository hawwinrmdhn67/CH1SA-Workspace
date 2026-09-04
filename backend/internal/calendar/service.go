package calendar

import (
	"context"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateEvent(ctx context.Context, event *models.CalendarEvent) error
	ListEvents(ctx context.Context) ([]*models.CalendarEvent, error)
	UpdateEvent(ctx context.Context, id uuid.UUID, updates map[string]interface{}) error
	DeleteEvent(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateEvent(ctx context.Context, event *models.CalendarEvent) error {
	event.Calendar = models.NormalizeCalendar(event.Calendar)
	return s.repo.Create(ctx, event)
}

func (s *service) ListEvents(ctx context.Context) ([]*models.CalendarEvent, error) {
	return s.repo.List(ctx)
}

func (s *service) UpdateEvent(ctx context.Context, id uuid.UUID, updates map[string]interface{}) error {
	event, err := s.repo.Get(ctx, id)
	if err != nil {
		return err
	}

	if title, ok := updates["title"].(string); ok {
		event.Title = title
	}
	if desc, ok := updates["description"].(string); ok {
		event.Description = desc
	}
	if date, ok := updates["date"].(string); ok {
		event.Date = date
	}
	if startTime, ok := updates["start_time"]; ok {
		if startTime == nil {
			event.StartTime = nil
		} else if str, ok := startTime.(string); ok {
			event.StartTime = &str
		}
	}
	if endTime, ok := updates["end_time"]; ok {
		if endTime == nil {
			event.EndTime = nil
		} else if str, ok := endTime.(string); ok {
			event.EndTime = &str
		}
	}
	if allDay, ok := updates["all_day"].(bool); ok {
		event.AllDay = allDay
	}
	if calendar, ok := updates["calendar"].(string); ok {
		event.Calendar = models.NormalizeCalendar(calendar)
	}

	return s.repo.Update(ctx, event)
}

func (s *service) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
