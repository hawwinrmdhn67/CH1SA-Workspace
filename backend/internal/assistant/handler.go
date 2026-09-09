package assistant

import (
	"context"
	"net/http"

	"chisa-assistant-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) HandleChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if req.ConversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ConversationID is required"})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := user.(*models.User).ID
	ctx := context.WithValue(c.Request.Context(), "userID", userID)

	resp, err := h.service.ProcessMessage(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process message"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) HandleConfirm(c *gin.Context) {
	var req ConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if req.ConversationID == "" || req.ConfirmationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ConversationID and ConfirmationID are required"})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := user.(*models.User).ID
	ctx := context.WithValue(c.Request.Context(), "userID", userID)

	resp, err := h.service.ConfirmAction(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm action"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) HandleToolResult(c *gin.Context) {
	var req ToolResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if req.ConversationID == "" || req.ConfirmationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ConversationID and ConfirmationID are required"})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := user.(*models.User).ID
	ctx := context.WithValue(c.Request.Context(), "userID", userID)

	resp, err := h.service.ProcessToolResult(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process tool result"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
