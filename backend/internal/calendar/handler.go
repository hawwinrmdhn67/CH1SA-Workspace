package calendar

import (
	"net/http"

	"chisa-assistant-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Create(c *gin.Context) {
	var event models.CalendarEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if event.Title == "" || event.Date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Title and date are required"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.CreateEvent(c.Request.Context(), userID, &event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to create event"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": event})
}

func (h *Handler) List(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	events, err := h.service.ListEvents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to fetch events"}})
		return
	}

	if events == nil {
		events = []*models.CalendarEvent{}
	}

	c.JSON(http.StatusOK, gin.H{"data": events})
}

func (h *Handler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid event ID"}})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.UpdateEvent(c.Request.Context(), userID, id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to update event"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event updated successfully"})
}

func (h *Handler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid event ID"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.DeleteEvent(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to delete event"}})
		return
	}

	c.Status(http.StatusNoContent)
}
