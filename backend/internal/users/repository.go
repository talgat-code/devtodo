package users

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
)

type Store struct {
	pool *pgxpool.Pool
}

type CreateInput struct {
	Name         string
	Email        string
	PasswordHash string
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Create(ctx context.Context, input CreateInput) (User, error) {
	row := s.pool.QueryRow(
		ctx,
		`INSERT INTO users (name, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, email, password_hash, created_at, updated_at`,
		strings.TrimSpace(input.Name),
		normalizeEmail(input.Email),
		input.PasswordHash,
	)

	user, err := scanUser(row)
	if err != nil {
		return User{}, translateError(err)
	}

	return user, nil
}

func (s *Store) GetByEmail(ctx context.Context, email string) (User, error) {
	row := s.pool.QueryRow(
		ctx,
		`SELECT id, name, email, password_hash, created_at, updated_at
		 FROM users
		 WHERE email = $1`,
		normalizeEmail(email),
	)

	user, err := scanUser(row)
	if err != nil {
		return User{}, translateError(err)
	}

	return user, nil
}

func (s *Store) GetByID(ctx context.Context, id string) (User, error) {
	row := s.pool.QueryRow(
		ctx,
		`SELECT id, name, email, password_hash, created_at, updated_at
		 FROM users
		 WHERE id = $1`,
		id,
	)

	user, err := scanUser(row)
	if err != nil {
		return User{}, translateError(err)
	}

	return user, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(scanner rowScanner) (User, error) {
	var user User

	err := scanner.Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return User{}, err
	}

	return user, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func translateError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrUserNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrEmailAlreadyExists
	}

	return err
}
