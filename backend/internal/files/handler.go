package files

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

func (h *Handler) CreateFolder(c *gin.Context) {
	var folder models.Folder
	if err := c.ShouldBindJSON(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if folder.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Folder name is required"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.CreateFolder(c.Request.Context(), userID, &folder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to create folder"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": folder})
}

func (h *Handler) ListFolders(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	folders, err := h.service.ListFolders(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to fetch folders"}})
		return
	}

	if folders == nil {
		folders = []*models.Folder{}
	}

	c.JSON(http.StatusOK, gin.H{"data": folders})
}

func (h *Handler) UpdateFolder(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid folder ID"}})
		return
	}

	var updates models.Folder
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}
	updates.ID = id

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.UpdateFolder(c.Request.Context(), userID, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to update folder"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updates})
}

func (h *Handler) DeleteFolder(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid folder ID"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.DeleteFolder(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to delete folder"}})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) CreateFile(c *gin.Context) {
	var file models.File
	if err := c.ShouldBindJSON(&file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}

	if file.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "File name is required"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.CreateFile(c.Request.Context(), userID, &file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to create file"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": file})
}

func (h *Handler) ListFiles(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	files, err := h.service.ListFiles(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to fetch files"}})
		return
	}

	if files == nil {
		files = []*models.File{}
	}

	c.JSON(http.StatusOK, gin.H{"data": files})
}

func (h *Handler) UpdateFile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid file ID"}})
		return
	}

	var updates models.File
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid request payload"}})
		return
	}
	updates.ID = id

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.UpdateFile(c.Request.Context(), userID, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to update file"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updates})
}

func (h *Handler) DeleteFile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"message": "Invalid file ID"}})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": gin.H{"message": "Unauthorized"}})
		return
	}
	userID := user.(*models.User).ID

	if err := h.service.DeleteFile(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"message": "Failed to delete file"}})
		return
	}

	c.Status(http.StatusNoContent)
}
