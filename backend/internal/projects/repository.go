package projects

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrProjectNotFound = errors.New("project not found")

type Store struct {
	pool *pgxpool.Pool
}

type CreateInput struct {
	UserID      string
	Title       string
	Description string
	Color       string
}

type UpdateInput struct {
	ID          string
	UserID      string
	Title       *string
	Description *string
	Color       *string
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Create(ctx context.Context, input CreateInput) (Project, error) {
	row := s.pool.QueryRow(
		ctx,
		`INSERT INTO projects (user_id, title, description, color)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, title, COALESCE(description, ''), COALESCE(color, ''), created_at, updated_at`,
		input.UserID,
		input.Title,
		input.Description,
		input.Color,
	)

	project, err := scanProject(row)
	if err != nil {
		return Project{}, translateError(err)
	}

	return project, nil
}

func (s *Store) ListByUserID(ctx context.Context, userID string) ([]Project, error) {
	rows, err := s.pool.Query(
		ctx,
		`SELECT id, user_id, title, COALESCE(description, ''), COALESCE(color, ''), created_at, updated_at
		 FROM projects
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	projects := make([]Project, 0)

	for rows.Next() {
		project, err := scanProject(rows)
		if err != nil {
			return nil, translateError(err)
		}

		projects = append(projects, project)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return projects, nil
}

func (s *Store) GetByID(ctx context.Context, id, userID string) (Project, error) {
	row := s.pool.QueryRow(
		ctx,
		`SELECT id, user_id, title, COALESCE(description, ''), COALESCE(color, ''), created_at, updated_at
		 FROM projects
		 WHERE id = $1 AND user_id = $2`,
		id,
		userID,
	)

	project, err := scanProject(row)
	if err != nil {
		return Project{}, translateError(err)
	}

	return project, nil
}

func (s *Store) Update(ctx context.Context, input UpdateInput) (Project, error) {
	currentProject, err := s.GetByID(ctx, input.ID, input.UserID)
	if err != nil {
		return Project{}, err
	}

	title := currentProject.Title
	description := currentProject.Description
	color := currentProject.Color

	if input.Title != nil {
		title = *input.Title
	}

	if input.Description != nil {
		description = *input.Description
	}

	if input.Color != nil {
		color = *input.Color
	}

	row := s.pool.QueryRow(
		ctx,
		`UPDATE projects
		 SET title = $1,
		     description = $2,
		     color = $3,
		     updated_at = now()
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, user_id, title, COALESCE(description, ''), COALESCE(color, ''), created_at, updated_at`,
		title,
		description,
		color,
		input.ID,
		input.UserID,
	)

	project, err := scanProject(row)
	if err != nil {
		return Project{}, translateError(err)
	}

	return project, nil
}

func (s *Store) Delete(ctx context.Context, id, userID string) error {
	result, err := s.pool.Exec(
		ctx,
		`DELETE FROM projects
		 WHERE id = $1 AND user_id = $2`,
		id,
		userID,
	)
	if err != nil {
		return translateError(err)
	}

	if result.RowsAffected() == 0 {
		return ErrProjectNotFound
	}

	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanProject(scanner rowScanner) (Project, error) {
	var project Project

	err := scanner.Scan(
		&project.ID,
		&project.UserID,
		&project.Title,
		&project.Description,
		&project.Color,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		return Project{}, err
	}

	return project, nil
}

func translateError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrProjectNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "22P02" {
		return ErrProjectNotFound
	}

	return err
}

func NormalizeOptionalText(value string) string {
	return strings.TrimSpace(value)
}
