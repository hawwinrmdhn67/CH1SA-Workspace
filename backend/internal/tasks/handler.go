package tasks

import (
	"encoding/json"
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
	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if task.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Title is required"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.CreateTask(c.Request.Context(), userID, &task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to create task"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": task})
}

func (h *Handler) List(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	tasks, err := h.service.ListTasks(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to fetch tasks"}})
		return
	}

	if tasks == nil {
		tasks = []*models.Task{}
	}

	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func (h *Handler) Get(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid task ID"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	task, err := h.service.GetTask(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "Task not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": task})
}

func (h *Handler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid task ID"}})
		return
	}

	var raw map[string]interface{}
	if err := c.ShouldBindJSON(&raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	existing, err := h.service.GetTask(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "Task not found"}})
		return
	}

	if val, ok := raw["title"].(string); ok && val != "" {
		existing.Title = val
	}
	if val, ok := raw["description"].(string); ok {
		existing.Description = val
	}
	if val, ok := raw["status"].(string); ok && val != "" {
		existing.Status = val
	}
	if val, ok := raw["priority"].(string); ok && val != "" {
		existing.Priority = val
	}

	updateStringPtr := func(key string, target **string) {
		if val, ok := raw[key]; ok {
			if val == nil {
				*target = nil
			} else if str, isStr := val.(string); isStr {
				if str == "" {
					*target = nil
				} else {
					*target = &str
				}
			}
		}
	}

	updateStringPtr("startDate", &existing.StartDate)
	updateStringPtr("dueDate", &existing.DueDate)

	if subtasksVal, ok := raw["subtasks"]; ok {
		b, _ := json.Marshal(subtasksVal)
		var st []models.Subtask
		if err := json.Unmarshal(b, &st); err == nil {
			existing.Subtasks = st
		}
	}

	if err := h.service.UpdateTask(c.Request.Context(), userID, existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to update task: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existing})
}

func (h *Handler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid task ID"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.DeleteTask(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to delete task"}})
		return
	}

	c.Status(http.StatusNoContent)
}
