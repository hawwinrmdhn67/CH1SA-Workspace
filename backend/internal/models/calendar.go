package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type CalendarEvent struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        string    `json:"date"`
	StartTime   *string   `json:"start_time,omitempty"`
	EndTime     *string   `json:"end_time,omitempty"`
	AllDay      bool      `json:"all_day"`
	Calendar    string    `json:"calendar"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func NormalizeCalendar(c string) string {
	c = strings.ToLower(strings.TrimSpace(c))
	switch c {
	case "personal", "work", "team", "focus", "indonesia-holidays":
		return c
	default:
		return "personal"
	}
}
