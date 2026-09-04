package tasks

import (
	"context"
	"errors"
	"time"

	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Service interface {
	CreateTask(ctx context.Context, task *models.Task) error
	GetTask(ctx context.Context, id uuid.UUID) (*models.Task, error)
	ListTasks(ctx context.Context) ([]*models.Task, error)
	UpdateTask(ctx context.Context, task *models.Task) error
	DeleteTask(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func validateDates(startDate, dueDate *string) error {
	if startDate != nil && dueDate != nil && *startDate != "" && *dueDate != "" {
		start, err := time.Parse("2006-01-02", *startDate)
		if err != nil {
			return errors.New("invalid start date format")
		}
		due, err := time.Parse("2006-01-02", *dueDate)
		if err != nil {
			return errors.New("invalid due date format")
		}
		if start.After(due) {
			return errors.New("start date cannot be after due date")
		}
	}
	return nil
}

func (s *service) CreateTask(ctx context.Context, task *models.Task) error {
	if err := validateDates(task.StartDate, task.DueDate); err != nil {
		return err
	}
	if task.Status == "" {
		task.Status = "backlog"
	}
	if task.Priority == "" {
		task.Priority = "None"
	}
	return s.repo.Create(ctx, task)
}

func (s *service) GetTask(ctx context.Context, id uuid.UUID) (*models.Task, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) ListTasks(ctx context.Context) ([]*models.Task, error) {
	return s.repo.List(ctx)
}

func (s *service) UpdateTask(ctx context.Context, task *models.Task) error {
	if err := validateDates(task.StartDate, task.DueDate); err != nil {
		return err
	}
	return s.repo.Update(ctx, task)
}

func (s *service) DeleteTask(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
