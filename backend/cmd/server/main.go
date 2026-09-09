package main

import (
	"log"
	"net/http"
	"strings"

	"chisa-assistant-backend/internal/admin"
	"chisa-assistant-backend/internal/assistant"
	"chisa-assistant-backend/internal/auth"
	"chisa-assistant-backend/internal/calendar"
	"chisa-assistant-backend/internal/config"
	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/files"
	auth_middleware "chisa-assistant-backend/internal/middleware"
	"chisa-assistant-backend/internal/notes"
	"chisa-assistant-backend/internal/tasks"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.NineRouterAPIKey == "" {
		log.Fatal("NINEROUTER_API_KEY environment variable is required")
	}

	if err := database.InitDB(); err != nil {
		log.Printf("Warning: Failed to initialize database: %v", err)
	} else {
		log.Println("Successfully connected to PostgreSQL")
		defer database.CloseDB()
	}

	taskRepo := tasks.NewRepository()
	taskService := tasks.NewService(taskRepo)
	taskHandler := tasks.NewHandler(taskService)

	calendarRepo := calendar.NewRepository()
	calendarService := calendar.NewService(calendarRepo)
	calendarHandler := calendar.NewHandler(calendarService)

	notesRepo := notes.NewRepository()
	notesService := notes.NewService(notesRepo)
	notesHandler := notes.NewHandler(notesService)

	filesRepo := files.NewRepository()
	filesService := files.NewService(filesRepo)
	filesHandler := files.NewHandler(filesService)

	authRepo := auth.NewRepository()
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	adminRepo := admin.NewRepository()
	adminService := admin.NewService(adminRepo, authService)
	adminHandler := admin.NewHandler(adminService)

	assistantService, err := assistant.NewService(cfg, taskService, calendarService, notesService, filesService)
	if err != nil {
		log.Fatalf("Failed to initialize assistant service: %v", err)
	}
	assistantHandler := assistant.NewHandler(assistantService)

	r := gin.New()

	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	var origins []string
	for _, o := range strings.Split(cfg.CORSOrigins, ",") {
		origins = append(origins, strings.TrimSpace(o))
	}

	corsMiddleware := cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "ngrok-skip-browser-warning"},
		ExposeHeaders:    []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	r.Use(corsMiddleware)

	r.NoRoute(corsMiddleware, func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not Found"})
	})
	
	r.NoMethod(corsMiddleware, func(c *gin.Context) {
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method Not Allowed"})
	})

	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	r.GET("/health/db", func(c *gin.Context) {
		if database.Pool == nil {
			c.String(http.StatusServiceUnavailable, "Database not connected")
			return
		}
		if err := database.Pool.Ping(c.Request.Context()); err != nil {
			c.String(http.StatusServiceUnavailable, "Database ping failed: "+err.Error())
			return
		}
		c.String(http.StatusOK, "Database is healthy")
	})

	api := r.Group("/api")

	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/verify-recovery", authHandler.VerifyRecoveryCode)
		authRoutes.POST("/reset-password", authHandler.ResetPassword)
		authRoutes.POST("/logout", authHandler.Logout)

		protectedAuth := authRoutes.Group("")
		protectedAuth.Use(auth_middleware.RequireAuth(authService))
		protectedAuth.GET("/me", authHandler.Me)
		protectedAuth.POST("/change-password", authHandler.ChangePassword)
		protectedAuth.PATCH("/username", authHandler.UpdateUsername)
		protectedAuth.GET("/recovery", authHandler.GetRecoveryCode)
		protectedAuth.POST("/recovery/generate", authHandler.GenerateRecoveryCode)
	}

	adminRoutes := api.Group("/admin/users")
	adminRoutes.Use(auth_middleware.RequireAuth(authService), auth_middleware.RequireAdmin())
	{
		adminRoutes.GET("", adminHandler.ListUsers)
		adminRoutes.POST("", adminHandler.CreateUser)
		adminRoutes.PATCH("/:id", adminHandler.UpdateUser)
		adminRoutes.DELETE("/:id", adminHandler.DeleteUser)
		adminRoutes.POST("/:id/reset-password", adminHandler.ResetUserPassword)
	}

	taskRoutes := api.Group("/tasks")
	taskRoutes.Use(auth_middleware.RequireAuth(authService))
	{
		taskRoutes.GET("", taskHandler.List)
		taskRoutes.POST("", taskHandler.Create)
		taskRoutes.GET("/:id", taskHandler.Get)
		taskRoutes.PATCH("/:id", taskHandler.Update)
		taskRoutes.DELETE("/:id", taskHandler.Delete)
	}

	calendarRoutes := api.Group("/calendar")
	calendarRoutes.Use(auth_middleware.RequireAuth(authService))
	{
		calendarRoutes.GET("", calendarHandler.List)
		calendarRoutes.POST("", calendarHandler.Create)
		calendarRoutes.PATCH("/:id", calendarHandler.Update)
		calendarRoutes.DELETE("/:id", calendarHandler.Delete)
	}

	notesRoutes := api.Group("/notes")
	notesRoutes.Use(auth_middleware.RequireAuth(authService))
	{
		notesRoutes.GET("", notesHandler.List)
		notesRoutes.POST("", notesHandler.Create)
		notesRoutes.GET("/:id", notesHandler.Get)
		notesRoutes.PATCH("/:id", notesHandler.Update)
		notesRoutes.DELETE("/:id", notesHandler.Delete)
	}

	foldersRoutes := api.Group("/folders")
	foldersRoutes.Use(auth_middleware.RequireAuth(authService), auth_middleware.RequireAdmin())
	{
		foldersRoutes.GET("", filesHandler.ListFolders)
		foldersRoutes.POST("", filesHandler.CreateFolder)
		foldersRoutes.PATCH("/:id", filesHandler.UpdateFolder)
		foldersRoutes.DELETE("/:id", filesHandler.DeleteFolder)
	}

	filesRoutes := api.Group("/files")
	filesRoutes.Use(auth_middleware.RequireAuth(authService), auth_middleware.RequireAdmin())
	{
		filesRoutes.GET("", filesHandler.ListFiles)
		filesRoutes.POST("", filesHandler.CreateFile)
		filesRoutes.PATCH("/:id", filesHandler.UpdateFile)
		filesRoutes.DELETE("/:id", filesHandler.DeleteFile)
	}

	assistantRoutes := api.Group("/assistant")
	assistantRoutes.Use(auth_middleware.RequireAuth(authService))
	{
		assistantRoutes.POST("/chat", assistantHandler.HandleChat)
		assistantRoutes.POST("/confirm", assistantHandler.HandleConfirm)
		assistantRoutes.POST("/tool-result", assistantHandler.HandleToolResult)
	}

	log.Printf("Starting CHISA Assistant backend on port %s...", cfg.Port)
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}
	err = server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}
