package middleware

import (
	"net/http"

	"chisa-assistant-backend/internal/auth"
	"chisa-assistant-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RequireAuth(authService auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("chisa_session")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
			return
		}

		sessionID, err := uuid.Parse(cookie)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
			return
		}

		user, err := authService.ValidateSession(c.Request.Context(), sessionID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
			return
		}

		if user.MustChangePassword {
			path := c.Request.URL.Path
			if path != "/api/auth/change-password" && path != "/api/auth/logout" && path != "/api/auth/me" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": gin.H{"message": "Password change required", "code": "MUST_CHANGE_PASSWORD"}})
				return
			}
		}

		c.Set("user", user)
		c.Next()
	}
}

func GetUser(c *gin.Context) *models.User {
	if user, exists := c.Get("user"); exists {
		if u, ok := user.(*models.User); ok {
			return u
		}
	}
	return nil
}
