package projects

import (
	"errors"
	"net/http"
	"strings"

	"devtodo/internal/auth"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	store *Store
}

type createRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type updateRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
}

type listResponse struct {
	Projects []Project `json:"projects"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) List(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	projects, err := h.store.ListByUserID(c.Request.Context(), userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "could not load projects")
		return
	}

	c.JSON(http.StatusOK, listResponse{Projects: projects})
}

func (h *Handler) Create(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	var request createRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid request body")
		return
	}

	title := strings.TrimSpace(request.Title)
	description := NormalizeOptionalText(request.Description)
	color := NormalizeOptionalText(request.Color)

	switch {
	case title == "":
		writeError(c, http.StatusBadRequest, "title is required")
		return
	case len(title) > 150:
		writeError(c, http.StatusBadRequest, "title must be between 1 and 150 characters")
		return
	case len(color) > 20:
		writeError(c, http.StatusBadRequest, "color must be 20 characters or fewer")
		return
	}

	project, err := h.store.Create(c.Request.Context(), CreateInput{
		UserID:      userID,
		Title:       title,
		Description: description,
		Color:       color,
	})
	if err != nil {
		writeError(c, http.StatusInternalServerError, "could not create project")
		return
	}

	c.JSON(http.StatusCreated, project)
}

func (h *Handler) GetByID(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	project, err := h.store.GetByID(c.Request.Context(), c.Param("project_id"), userID)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			writeError(c, http.StatusNotFound, "project not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not load project")
		return
	}

	c.JSON(http.StatusOK, project)
}

func (h *Handler) Update(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	var request updateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid request body")
		return
	}

	input := UpdateInput{
		ID:     c.Param("project_id"),
		UserID: userID,
	}

	if request.Title != nil {
		title := strings.TrimSpace(*request.Title)
		if title == "" || len(title) > 150 {
			writeError(c, http.StatusBadRequest, "title must be between 1 and 150 characters")
			return
		}
		input.Title = &title
	}

	if request.Description != nil {
		description := NormalizeOptionalText(*request.Description)
		input.Description = &description
	}

	if request.Color != nil {
		color := NormalizeOptionalText(*request.Color)
		if len(color) > 20 {
			writeError(c, http.StatusBadRequest, "color must be 20 characters or fewer")
			return
		}
		input.Color = &color
	}

	project, err := h.store.Update(c.Request.Context(), input)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			writeError(c, http.StatusNotFound, "project not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not update project")
		return
	}

	c.JSON(http.StatusOK, project)
}

func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	err := h.store.Delete(c.Request.Context(), c.Param("project_id"), userID)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			writeError(c, http.StatusNotFound, "project not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not delete project")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func writeError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, errorResponse{Error: message})
}
