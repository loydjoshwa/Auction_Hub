package auth

import (
	"errors"
	"strings"

	"auction-hub/modules/users"
	"auction-hub/utilis"

	"gorm.io/gorm"
)

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

func (s *Service) Register(request RegisterRequest) (*users.User, error) {

	// Clean input
	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.ToLower(strings.TrimSpace(request.Email))

	// Check whether email has been verified
	if !IsEmailVerified(request.Email) {
		return nil, errors.New("email not verified")
	}

	// Check if email already exists
	_, err := s.Repository.FindUserByEmail(request.Email)

	if err == nil {
		return nil, errors.New("email already registered")
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Hash password
	hashedPassword, err := utilis.HashPassword(request.Password)

	if err != nil {
		return nil, err
	}

	// Create user
	user := &users.User{
		Name:     request.Name,
		Email:    request.Email,
		Password: hashedPassword,
		Role:     "user",
	}

	// Save user to database
	err = s.Repository.CreateUser(user)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) SendOTP(email string) error {

	email = strings.ToLower(strings.TrimSpace(email))

	// Generate OTP
	otp := GenerateOTP()

	// Store OTP in Redis for 5 minutes
	err := StoreOTP(email, otp)
	if err != nil {
		return err
	}

	// Send OTP through Gmail
	err = SendOTPEmail(email, otp)
	if err != nil {
		// Remove OTP if email sending fails
		DeleteOTP(email)
		return err
	}

	return nil
}

func (s *Service) VerifyOTP(email string, otp string) error {

	email = strings.ToLower(strings.TrimSpace(email))
	otp = strings.TrimSpace(otp)

	// Get OTP from Redis
	storedOTP, err := GetOTP(email)
	if err != nil {
		return errors.New("OTP expired or not found")
	}

	// Compare OTP
	if storedOTP != otp {
		return errors.New("invalid OTP")
	}

	// OTP is correct, delete it so it cannot be reused
	err = DeleteOTP(email)
	if err != nil {
		return err
	}

	// Mark email as verified
	err = MarkEmailVerified(email)
	if err != nil {
		return err
	}

	return nil
}
func (s *Service) Login(request LoginRequest) (*users.User, string, error) {

	request.Email = strings.ToLower(strings.TrimSpace(request.Email))

	// Find user by email
	user, err := s.Repository.FindUserByEmail(request.Email)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("invalid email or password")
		}

		return nil, "", err
	}

	// Check password
	if !utilis.CheckPassword(request.Password, user.Password) {
		return nil, "", errors.New("invalid email or password")
	}

	// Generate JWT token
	token, err := utilis.GenerateToken(
		user.ID,
		user.Email,
		user.Role,
	)

	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}