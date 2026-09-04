package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

type LoginRequest struct {
	Password string `json:"password"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	session, err := h.service.Login(c.Request.Context(), req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Invalid password"}})
		return
	}

	c.SetSameSite(http.SameSiteNoneMode)
	c.SetCookie(
		"chisa_session",
		session.ID.String(),
		int(time.Until(session.ExpiresAt).Seconds()),
		"/",
		"",
		true,  // Secure (required for SameSite=None)
		true,  // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged in successfully"})
}

func (h *Handler) Logout(c *gin.Context) {
	cookie, err := c.Cookie("chisa_session")
	if err == nil {
		if sessionID, err := uuid.Parse(cookie); err == nil {
			_ = h.service.Logout(c.Request.Context(), sessionID)
		}
	}

	c.SetSameSite(http.SameSiteNoneMode)
	c.SetCookie(
		"chisa_session",
		"",
		-1,
		"/",
		"",
		true,
		true,
	)

	c.Status(http.StatusNoContent)
}

func (h *Handler) Register(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if err := h.service.Register(c.Request.Context(), "Hawwin Ramadhan", req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to register user"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Registered successfully"})
}

type ResetPasswordRequest struct {
	Password     string `json:"password"`
	RecoveryCode string `json:"recoveryCode"`
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if err := h.service.ResetPassword(c.Request.Context(), req.RecoveryCode, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to reset password: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

func (h *Handler) GetRecoveryCode(c *gin.Context) {
	code, err := h.service.GetRecoveryCode(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to get recovery code"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"code": code}})
}

func (h *Handler) GenerateRecoveryCode(c *gin.Context) {
	code, err := h.service.RegenerateRecoveryCode(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to generate recovery code"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"code": code}})
}

func (h *Handler) Me(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"authenticated": true})
}
