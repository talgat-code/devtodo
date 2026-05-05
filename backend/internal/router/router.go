package router

import (
	"net/http"

	"devtodo/internal/auth"
	"devtodo/internal/database"
	"devtodo/internal/middleware"
	"devtodo/internal/projects"
	"devtodo/internal/users"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(appName string, dbPool *pgxpool.Pool, jwtSecret string) *gin.Engine {
	r := gin.Default()
	userStore := users.NewStore(dbPool)
	authService := auth.NewService(userStore, jwtSecret)
	authHandler := auth.NewHandler(authService)
	projectStore := projects.NewStore(dbPool)
	projectHandler := projects.NewHandler(projectStore)

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
	protectedRoutes.GET("/projects/:id", projectHandler.GetByID)
	protectedRoutes.PATCH("/projects/:id", projectHandler.Update)
	protectedRoutes.DELETE("/projects/:id", projectHandler.Delete)

	return r
}
