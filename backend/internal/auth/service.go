package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"devtodo/internal/users"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	ContextUserIDKey = "auth_user_id"
	ContextEmailKey  = "auth_user_email"
)

const accessTokenLifetime = 24 * time.Hour

var ErrInvalidCredentials = errors.New("invalid email or password")

type Service struct {
	users     *users.Store
	jwtSecret []byte
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type RegisterInput struct {
	Name     string
	Email    string
	Password string
}

type LoginInput struct {
	Email    string
	Password string
}

type LoginResult struct {
	AccessToken string         `json:"access_token"`
	TokenType   string         `json:"token_type"`
	User        users.AuthUser `json:"user"`
}

func NewService(userStore *users.Store, jwtSecret string) *Service {
	secret := strings.TrimSpace(jwtSecret)
	if secret == "" {
		secret = "change_me_later"
	}

	return &Service{
		users:     userStore,
		jwtSecret: []byte(secret),
	}
}

func (s *Service) Register(ctx context.Context, input RegisterInput) (users.User, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return users.User{}, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.users.Create(ctx, users.CreateInput{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(passwordHash),
	})
	if err != nil {
		return users.User{}, err
	}

	return user, nil
}

func (s *Service) Login(ctx context.Context, input LoginInput) (LoginResult, error) {
	user, err := s.users.GetByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, users.ErrUserNotFound) {
			return LoginResult{}, ErrInvalidCredentials
		}

		return LoginResult{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return LoginResult{}, ErrInvalidCredentials
	}

	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return LoginResult{}, err
	}

	return LoginResult{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		User:        user.AuthUser(),
	}, nil
}

func (s *Service) GetCurrentUser(ctx context.Context, userID string) (users.User, error) {
	return s.users.GetByID(ctx, userID)
}

func (s *Service) ParseToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
			}

			return s.jwtSecret, nil
		},
	)
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (s *Service) generateAccessToken(user users.User) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTokenLifetime)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return signedToken, nil
}
