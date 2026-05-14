package tasks

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidProjectID = errors.New("invalid project id")
	ErrProjectNotFound  = errors.New("project not found")
	ErrTaskNotFound     = errors.New("task not found")
)

type Store struct {
	pool *pgxpool.Pool
}

type CreateInput struct {
	ProjectID   string
	UserID      string
	Title       string
	Description string
	Status      string
	Priority    string
	DueDate     *time.Time
}

type UpdateInput struct {
	ID          string
	UserID      string
	Title       *string
	Description *string
	Status      *string
	Priority    *string
	DueDate     *time.Time
	DueDateSet  bool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Create(ctx context.Context, input CreateInput) (Task, error) {
	if err := s.ensureProjectOwned(ctx, input.ProjectID, input.UserID); err != nil {
		return Task{}, err
	}

	row := s.pool.QueryRow(
		ctx,
		`INSERT INTO tasks (project_id, title, description, status, priority, due_date)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, project_id, title, COALESCE(description, ''), status, priority, due_date, created_at, updated_at`,
		input.ProjectID,
		input.Title,
		input.Description,
		input.Status,
		input.Priority,
		input.DueDate,
	)

	task, err := scanTask(row)
	if err != nil {
		return Task{}, translateTaskError(err)
	}

	return task, nil
}

func (s *Store) ListByProjectID(ctx context.Context, projectID, userID string) ([]Task, error) {
	if err := s.ensureProjectOwned(ctx, projectID, userID); err != nil {
		return nil, err
	}

	rows, err := s.pool.Query(
		ctx,
		`SELECT id, project_id, title, COALESCE(description, ''), status, priority, due_date, created_at, updated_at
		 FROM tasks
		 WHERE project_id = $1
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, translateTaskError(err)
	}
	defer rows.Close()

	tasks := make([]Task, 0)

	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, translateTaskError(err)
		}

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		return nil, translateTaskError(err)
	}

	return tasks, nil
}

func (s *Store) GetByID(ctx context.Context, id, userID string) (Task, error) {
	row := s.pool.QueryRow(
		ctx,
		`SELECT t.id, t.project_id, t.title, COALESCE(t.description, ''), t.status, t.priority, t.due_date, t.created_at, t.updated_at
		 FROM tasks AS t
		 JOIN projects AS p ON p.id = t.project_id
		 WHERE t.id = $1 AND p.user_id = $2`,
		id,
		userID,
	)

	task, err := scanTask(row)
	if err != nil {
		return Task{}, translateTaskError(err)
	}

	return task, nil
}

func (s *Store) Update(ctx context.Context, input UpdateInput) (Task, error) {
	currentTask, err := s.GetByID(ctx, input.ID, input.UserID)
	if err != nil {
		return Task{}, err
	}

	title := currentTask.Title
	description := currentTask.Description
	status := currentTask.Status
	priority := currentTask.Priority
	dueDate := currentTask.DueDate

	if input.Title != nil {
		title = *input.Title
	}

	if input.Description != nil {
		description = *input.Description
	}

	if input.Status != nil {
		status = *input.Status
	}

	if input.Priority != nil {
		priority = *input.Priority
	}

	if input.DueDateSet {
		dueDate = input.DueDate
	}

	row := s.pool.QueryRow(
		ctx,
		`UPDATE tasks AS t
		 SET title = $1,
		     description = $2,
		     status = $3,
		     priority = $4,
		     due_date = $5,
		     updated_at = now()
		 FROM projects AS p
		 WHERE t.id = $6
		   AND t.project_id = p.id
		   AND p.user_id = $7
		 RETURNING t.id, t.project_id, t.title, COALESCE(t.description, ''), t.status, t.priority, t.due_date, t.created_at, t.updated_at`,
		title,
		description,
		status,
		priority,
		dueDate,
		input.ID,
		input.UserID,
	)

	task, err := scanTask(row)
	if err != nil {
		return Task{}, translateTaskError(err)
	}

	return task, nil
}

func (s *Store) Delete(ctx context.Context, id, userID string) error {
	result, err := s.pool.Exec(
		ctx,
		`DELETE FROM tasks AS t
		 USING projects AS p
		 WHERE t.id = $1
		   AND t.project_id = p.id
		   AND p.user_id = $2`,
		id,
		userID,
	)
	if err != nil {
		return translateTaskError(err)
	}

	if result.RowsAffected() == 0 {
		return ErrTaskNotFound
	}

	return nil
}

func (s *Store) ensureProjectOwned(ctx context.Context, projectID, userID string) error {
	var ownedProjectID string

	err := s.pool.QueryRow(
		ctx,
		`SELECT id
		 FROM projects
		 WHERE id = $1 AND user_id = $2`,
		projectID,
		userID,
	).Scan(&ownedProjectID)
	if err != nil {
		return translateProjectError(err)
	}

	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTask(scanner rowScanner) (Task, error) {
	var task Task
	var dueDate sql.NullTime

	err := scanner.Scan(
		&task.ID,
		&task.ProjectID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&dueDate,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		return Task{}, err
	}

	if dueDate.Valid {
		task.DueDate = &dueDate.Time
	}

	return task, nil
}

func translateProjectError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrProjectNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "22P02" {
		return ErrInvalidProjectID
	}

	return err
}

func translateTaskError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrTaskNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "22P02" {
		return ErrTaskNotFound
	}

	return err
}

func NormalizeOptionalText(value string) string {
	return strings.TrimSpace(value)
}
