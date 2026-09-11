package utilis

import (
	"time"

	"github.com/golang-jwt/jwt/v5" 
)

func GenerateToken(userID uint, email string, role string) (string, error) {

	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	secret := []byte("auction-hub-secret-key")

	return token.SignedString(secret)
}