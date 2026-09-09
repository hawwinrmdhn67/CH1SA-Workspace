package auth

import (
	"net/http"
	"time"

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

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	session, err := h.service.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Invalid password"}})
		return
	}

	cookieValue := session.ID.String()
	maxAge := int(time.Until(session.ExpiresAt).Seconds())
	
	cookie := &http.Cookie{
		Name:     "chisa_session",
		Value:    cookieValue,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	}
	
	c.Writer.Header().Add("Set-Cookie", cookie.String()+"; Partitioned")

	c.JSON(http.StatusOK, gin.H{"message": "Logged in successfully"})
}

func (h *Handler) Logout(c *gin.Context) {
	cookie, err := c.Cookie("chisa_session")
	if err == nil {
		if sessionID, err := uuid.Parse(cookie); err == nil {
			_ = h.service.Logout(c.Request.Context(), sessionID)
		}
	}

	clearCookie := &http.Cookie{
		Name:     "chisa_session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	}
	c.Writer.Header().Add("Set-Cookie", clearCookie.String()+"; Partitioned")

	c.Status(http.StatusNoContent)
}

// Register is removed since users are created by admins

type ResetPasswordRequest struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	RecoveryCode string `json:"recoveryCode"`
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if err := h.service.ResetPassword(c.Request.Context(), req.Username, req.RecoveryCode, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to reset password: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

type VerifyRecoveryRequest struct {
	RecoveryCode string `json:"recoveryCode"`
}

func (h *Handler) VerifyRecoveryCode(c *gin.Context) {
	var req VerifyRecoveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	username, err := h.service.VerifyRecoveryCode(c.Request.Context(), req.RecoveryCode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"username": username}})
}

func (h *Handler) GetRecoveryCode(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	code, err := h.service.GetRecoveryCode(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to get recovery code"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"code": code}})
}

func (h *Handler) GenerateRecoveryCode(c *gin.Context) {
	user := c.MustGet("user").(*models.User)
	code, err := h.service.RegenerateRecoveryCode(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to generate recovery code"}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"code": code}})
}

func (h *Handler) Me(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	c.JSON(http.StatusOK, user)
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func (h *Handler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	user := c.MustGet("user").(*models.User)

	if err := h.service.ChangePassword(c.Request.Context(), user.ID, req.CurrentPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Failed to change password: " + err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

type UpdateUsernameRequest struct {
	Username string `json:"username"`
}

func (h *Handler) UpdateUsername(c *gin.Context) {
	var req UpdateUsernameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	user := c.MustGet("user").(*models.User)

	if err := h.service.UpdateUsername(c.Request.Context(), user.ID, req.Username); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": gin.H{"message": "Failed to update username, it might already exist"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Username updated successfully"})
}
