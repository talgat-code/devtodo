package router

import (
	"net/http"

	"devtodo/internal/auth"
	"devtodo/internal/database"
	"devtodo/internal/middleware"
	"devtodo/internal/projects"
	"devtodo/internal/tasks"
	"devtodo/internal/users"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(appName string, dbPool *pgxpool.Pool, jwtSecret string) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.SecurityHeaders())

	userStore := users.NewStore(dbPool)
	authService := auth.NewService(userStore, jwtSecret)
	authHandler := auth.NewHandler(authService)
	projectStore := projects.NewStore(dbPool)
	projectHandler := projects.NewHandler(projectStore)
	taskStore := tasks.NewStore(dbPool)
	taskHandler := tasks.NewHandler(taskStore)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"app":    appName,
		})
	})

	r.GET("/ready", func(c *gin.Context) {
		if err := database.Ping(c.Request.Context(), dbPool); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"database": "not connected",
				"status":   "error",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"database": "connected",
			"status":   "ok",
		})
	})

	api := r.Group("/api")
	authRoutes := api.Group("/auth")
	authRoutes.POST("/register", authHandler.Register)
	authRoutes.POST("/login", authHandler.Login)

	protectedRoutes := api.Group("")
	protectedRoutes.Use(middleware.RequireAuth(authService))
	protectedRoutes.GET("/me", authHandler.Me)
	protectedRoutes.GET("/projects", projectHandler.List)
	protectedRoutes.POST("/projects", projectHandler.Create)
	protectedRoutes.GET("/projects/:project_id", projectHandler.GetByID)
	protectedRoutes.PATCH("/projects/:project_id", projectHandler.Update)
	protectedRoutes.DELETE("/projects/:project_id", projectHandler.Delete)
	protectedRoutes.GET("/projects/:project_id/tasks", taskHandler.List)
	protectedRoutes.POST("/projects/:project_id/tasks", taskHandler.Create)
	protectedRoutes.GET("/tasks/:id", taskHandler.GetByID)
	protectedRoutes.PATCH("/tasks/:id", taskHandler.Update)
	protectedRoutes.DELETE("/tasks/:id", taskHandler.Delete)

	return r
}
