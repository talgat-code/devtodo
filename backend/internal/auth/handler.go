package auth

import (
	"errors"
	"net/http"
	"strings"

	"devtodo/internal/users"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(c *gin.Context) {
	var request registerRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid request body")
		return
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.TrimSpace(request.Email)

	switch {
	case request.Name == "":
		writeError(c, http.StatusBadRequest, "name is required")
		return
	case request.Email == "":
		writeError(c, http.StatusBadRequest, "email is required")
		return
	case strings.TrimSpace(request.Password) == "":
		writeError(c, http.StatusBadRequest, "password is required")
		return
	case len(request.Password) < 8:
		writeError(c, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	user, err := h.service.Register(c.Request.Context(), RegisterInput{
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
	})
	if err != nil {
		if errors.Is(err, users.ErrEmailAlreadyExists) {
			writeError(c, http.StatusConflict, "email already exists")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not create user")
		return
	}

	c.JSON(http.StatusCreated, user.Public())
}

func (h *Handler) Login(c *gin.Context) {
	var request loginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid request body")
		return
	}

	request.Email = strings.TrimSpace(request.Email)

	switch {
	case request.Email == "":
		writeError(c, http.StatusBadRequest, "email is required")
		return
	case strings.TrimSpace(request.Password) == "":
		writeError(c, http.StatusBadRequest, "password is required")
		return
	}

	result, err := h.service.Login(c.Request.Context(), LoginInput{
		Email:    request.Email,
		Password: request.Password,
	})
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			writeError(c, http.StatusUnauthorized, "invalid email or password")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not log in")
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) Me(c *gin.Context) {
	userID := c.GetString(ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	user, err := h.service.GetCurrentUser(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, users.ErrUserNotFound) {
			writeError(c, http.StatusNotFound, "user not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not load user")
		return
	}

	c.JSON(http.StatusOK, user.Public())
}

func writeError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, errorResponse{Error: message})
}
