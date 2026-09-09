package assistant

import (
	"context"
	"net/http"

	"encoding/json"

	"chisa-assistant-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func setupSSE(c *gin.Context) func(string) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	return func(text string) {
		msg := map[string]string{"type": "chunk", "text": text}
		b, _ := json.Marshal(msg)
		c.Writer.Write([]byte("data: " + string(b) + "\n\n"))
		c.Writer.Flush()
	}
}

func sendFinalSSE(c *gin.Context, resp ChatResponse) {
	msg := map[string]interface{}{"type": "final", "response": resp}
	b, _ := json.Marshal(msg)
	c.Writer.Write([]byte("data: " + string(b) + "\n\n"))
	c.Writer.Write([]byte("data: [DONE]\n\n"))
	c.Writer.Flush()
}

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

	onChunk := setupSSE(c)
	resp, err := h.service.ProcessMessage(ctx, req, onChunk)
	if err != nil {
		msg := map[string]interface{}{"type": "error", "error": "Failed to process message"}
		b, _ := json.Marshal(msg)
		c.Writer.Write([]byte("data: " + string(b) + "\n\n"))
		c.Writer.Flush()
		return
	}

	sendFinalSSE(c, resp)
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

	onChunk := setupSSE(c)
	resp, err := h.service.ConfirmAction(ctx, req, onChunk)
	if err != nil {
		msg := map[string]interface{}{"type": "error", "error": "Failed to confirm action"}
		b, _ := json.Marshal(msg)
		c.Writer.Write([]byte("data: " + string(b) + "\n\n"))
		c.Writer.Flush()
		return
	}

	sendFinalSSE(c, resp)
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

	onChunk := setupSSE(c)
	resp, err := h.service.ProcessToolResult(ctx, req, onChunk)
	if err != nil {
		msg := map[string]interface{}{"type": "error", "error": "Failed to process tool result"}
		b, _ := json.Marshal(msg)
		c.Writer.Write([]byte("data: " + string(b) + "\n\n"))
		c.Writer.Flush()
		return
	}

	sendFinalSSE(c, resp)
}
