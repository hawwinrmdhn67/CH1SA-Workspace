package notes

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
	var note models.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if note.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Title is required"}})
		return
	}

	if err := h.service.CreateNote(c.Request.Context(), &note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to create note"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": note})
}

func (h *Handler) List(c *gin.Context) {
	notes, err := h.service.ListNotes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to fetch notes"}})
		return
	}

	if notes == nil {
		notes = []*models.Note{}
	}

	c.JSON(http.StatusOK, gin.H{"data": notes})
}

func (h *Handler) Get(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid note ID"}})
		return
	}

	note, err := h.service.GetNote(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "Note not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": note})
}

func (h *Handler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid note ID"}})
		return
	}

	var updates models.Note
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	existing, err := h.service.GetNote(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"message": "Note not found"}})
		return
	}

	if updates.Title != "" {
		existing.Title = updates.Title
	}
	if updates.Content != "" {
		existing.Content = updates.Content
	}

	if err := h.service.UpdateNote(c.Request.Context(), existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to update note"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existing})
}

func (h *Handler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid note ID"}})
		return
	}

	if err := h.service.DeleteNote(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to delete note"}})
		return
	}

	c.Status(http.StatusNoContent)
}
