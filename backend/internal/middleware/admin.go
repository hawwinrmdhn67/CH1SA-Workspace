package middleware

import (
	"net/http"

	"chisa-assistant-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
			return
		}

		if u, ok := user.(*models.User); ok {
			if u.Role != "admin" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": gin.H{"message": "Forbidden: Admin access required"}})
				return
			}
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
			return
		}

		c.Next()
	}
}
