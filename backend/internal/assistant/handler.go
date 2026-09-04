package assistant

import (
	"net/http"

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

	resp, err := h.service.ProcessMessage(c.Request.Context(), req)
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

	resp, err := h.service.ConfirmAction(c.Request.Context(), req)
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

	resp, err := h.service.ProcessToolResult(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process tool result"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
