package tasks

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"devtodo/internal/auth"

	"github.com/gin-gonic/gin"
)

const (
	defaultStatus   = "todo"
	defaultPriority = "medium"
)

var (
	allowedStatuses = map[string]struct{}{
		"todo":        {},
		"in_progress": {},
		"review":      {},
		"done":        {},
	}
	allowedPriorities = map[string]struct{}{
		"low":    {},
		"medium": {},
		"high":   {},
		"urgent": {},
	}
)

type Handler struct {
	store *Store
}

type createRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	Priority    string  `json:"priority"`
	DueDate     *string `json:"due_date"`
}

type updateRequest struct {
	Title       optionalString `json:"title"`
	Description optionalString `json:"description"`
	Status      optionalString `json:"status"`
	Priority    optionalString `json:"priority"`
	DueDate     optionalString `json:"due_date"`
}

type listResponse struct {
	Tasks []Task `json:"tasks"`
}

type errorResponse struct {
	Error string `json:"error"`
}

type optionalString struct {
	Set   bool
	Value *string
}

func (o *optionalString) UnmarshalJSON(data []byte) error {
	o.Set = true

	if string(data) == "null" {
		o.Value = nil
		return nil
	}

	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}

	o.Value = &value
	return nil
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

	tasks, err := h.store.ListByProjectID(c.Request.Context(), c.Param("project_id"), userID)
	if err != nil {
		if errors.Is(err, ErrInvalidProjectID) {
			writeError(c, http.StatusBadRequest, "invalid project_id")
			return
		}

		if errors.Is(err, ErrProjectNotFound) {
			writeError(c, http.StatusNotFound, "project not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not load tasks")
		return
	}

	c.JSON(http.StatusOK, listResponse{Tasks: tasks})
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
	status := strings.TrimSpace(request.Status)
	priority := strings.TrimSpace(request.Priority)

	if status == "" {
		status = defaultStatus
	}

	if priority == "" {
		priority = defaultPriority
	}

	dueDate, err := parseDueDate(request.DueDate)
	if err != nil {
		writeError(c, http.StatusBadRequest, "due_date must be null or a valid timestamp")
		return
	}

	switch {
	case title == "":
		writeError(c, http.StatusBadRequest, "title is required")
		return
	case len(title) > 200:
		writeError(c, http.StatusBadRequest, "title must be between 1 and 200 characters")
		return
	case !isAllowedStatus(status):
		writeError(c, http.StatusBadRequest, "status must be one of: todo, in_progress, review, done")
		return
	case !isAllowedPriority(priority):
		writeError(c, http.StatusBadRequest, "priority must be one of: low, medium, high, urgent")
		return
	}

	task, err := h.store.Create(c.Request.Context(), CreateInput{
		ProjectID:   c.Param("project_id"),
		UserID:      userID,
		Title:       title,
		Description: description,
		Status:      status,
		Priority:    priority,
		DueDate:     dueDate,
	})
	if err != nil {
		if errors.Is(err, ErrInvalidProjectID) {
			writeError(c, http.StatusBadRequest, "invalid project_id")
			return
		}

		if errors.Is(err, ErrProjectNotFound) {
			writeError(c, http.StatusNotFound, "project not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not create task")
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *Handler) GetByID(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	task, err := h.store.GetByID(c.Request.Context(), c.Param("id"), userID)
	if err != nil {
		if errors.Is(err, ErrTaskNotFound) {
			writeError(c, http.StatusNotFound, "task not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not load task")
		return
	}

	c.JSON(http.StatusOK, task)
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
		ID:     c.Param("id"),
		UserID: userID,
	}

	if request.Title.Set {
		if request.Title.Value == nil {
			writeError(c, http.StatusBadRequest, "title must be between 1 and 200 characters")
			return
		}

		title := strings.TrimSpace(*request.Title.Value)
		if title == "" || len(title) > 200 {
			writeError(c, http.StatusBadRequest, "title must be between 1 and 200 characters")
			return
		}

		input.Title = &title
	}

	if request.Description.Set {
		description := ""
		if request.Description.Value != nil {
			description = NormalizeOptionalText(*request.Description.Value)
		}

		input.Description = &description
	}

	if request.Status.Set {
		if request.Status.Value == nil {
			writeError(c, http.StatusBadRequest, "status must be one of: todo, in_progress, review, done")
			return
		}

		status := strings.TrimSpace(*request.Status.Value)
		if !isAllowedStatus(status) {
			writeError(c, http.StatusBadRequest, "status must be one of: todo, in_progress, review, done")
			return
		}

		input.Status = &status
	}

	if request.Priority.Set {
		if request.Priority.Value == nil {
			writeError(c, http.StatusBadRequest, "priority must be one of: low, medium, high, urgent")
			return
		}

		priority := strings.TrimSpace(*request.Priority.Value)
		if !isAllowedPriority(priority) {
			writeError(c, http.StatusBadRequest, "priority must be one of: low, medium, high, urgent")
			return
		}

		input.Priority = &priority
	}

	if request.DueDate.Set {
		input.DueDateSet = true

		dueDate, err := parseDueDate(request.DueDate.Value)
		if err != nil {
			writeError(c, http.StatusBadRequest, "due_date must be null or a valid timestamp")
			return
		}

		input.DueDate = dueDate
	}

	task, err := h.store.Update(c.Request.Context(), input)
	if err != nil {
		if errors.Is(err, ErrTaskNotFound) {
			writeError(c, http.StatusNotFound, "task not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not update task")
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetString(auth.ContextUserIDKey)
	if userID == "" {
		writeError(c, http.StatusUnauthorized, "authentication required")
		return
	}

	err := h.store.Delete(c.Request.Context(), c.Param("id"), userID)
	if err != nil {
		if errors.Is(err, ErrTaskNotFound) {
			writeError(c, http.StatusNotFound, "task not found")
			return
		}

		writeError(c, http.StatusInternalServerError, "could not delete task")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func isAllowedStatus(value string) bool {
	_, ok := allowedStatuses[value]
	return ok
}

func isAllowedPriority(value string) bool {
	_, ok := allowedPriorities[value]
	return ok
}

func parseDueDate(rawValue *string) (*time.Time, error) {
	if rawValue == nil {
		return nil, nil
	}

	value := strings.TrimSpace(*rawValue)
	if value == "" {
		return nil, errors.New("empty due date")
	}

	formats := []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
	}

	for _, format := range formats {
		parsedTime, err := time.Parse(format, value)
		if err == nil {
			return &parsedTime, nil
		}
	}

	return nil, errors.New("invalid due date")
}

func writeError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, errorResponse{Error: message})
}
