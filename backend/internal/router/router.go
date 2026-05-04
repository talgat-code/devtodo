package router

import (
	"net/http"

	"devtodo/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(appName string, dbPool *pgxpool.Pool) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"app":    appName,
		})
	})

	r.GET("/ready", func(c *gin.Context) {
		if err := database.Ping(c.Request.Context(), dbPool); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":   "error",
				"database": "not connected",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ok",
			"database": "connected",
		})
	})

	return r
}
