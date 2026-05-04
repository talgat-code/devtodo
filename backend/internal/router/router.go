package router

import "github.com/gin-gonic/gin"

func SetupRouter(appName string) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"app":    appName,
		})
	})

	return r
}
