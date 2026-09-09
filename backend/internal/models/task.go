package models

import (
	"time"

	"github.com/google/uuid"
)

type Subtask struct {
	ID          uuid.UUID `json:"id"`
	TaskID      uuid.UUID `json:"taskId"`
	UserID      uuid.UUID `json:"-"`
	Title       string    `json:"title"`
	IsCompleted bool      `json:"isCompleted"`
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Task struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"-"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	StartDate   *string   `json:"startDate,omitempty"`
	DueDate     *string   `json:"dueDate,omitempty"`
	Subtasks    []Subtask `json:"subtasks"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
