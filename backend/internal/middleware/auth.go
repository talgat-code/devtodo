package middleware

import (
	"net/http"
	"strings"

	"devtodo/internal/auth"

	"github.com/gin-gonic/gin"
)

type errorResponse struct {
	Error string `json:"error"`
}

func RequireAuth(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, ok := extractBearerToken(c.GetHeader("Authorization"))
		if !ok {
			c.JSON(http.StatusUnauthorized, errorResponse{Error: "missing or invalid authorization header"})
			c.Abort()
			return
		}

		claims, err := authService.ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, errorResponse{Error: "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set(auth.ContextUserIDKey, claims.UserID)
		c.Set(auth.ContextEmailKey, claims.Email)
		c.Next()
	}
}

func extractBearerToken(headerValue string) (string, bool) {
	parts := strings.SplitN(strings.TrimSpace(headerValue), " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", false
	}

	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", false
	}

	return token, true
}
