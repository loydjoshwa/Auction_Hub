package auth

import (
	"fmt"
	"math/rand"
	"time"

	"auction-hub/database"
)

func GenerateOTP() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	otp := r.Intn(900000) + 100000

	return fmt.Sprintf("%06d", otp)
}

func StoreOTP(email string, otp string) error {
	key := "otp:" + email

	return database.RedisClient.Set(
		database.RedisContext,
		key,
		otp,
		5*time.Minute,
	).Err()
}

func GetOTP(email string) (string, error) {
	key := "otp:" + email

	return database.RedisClient.Get(
		database.RedisContext,
		key,
	).Result()
}

func DeleteOTP(email string) error {
	key := "otp:" + email

	return database.RedisClient.Del(
		database.RedisContext,
		key,
	).Err()
}

func MarkEmailVerified(email string) error {
	key := "verified:" + email

	return database.RedisClient.Set(
		database.RedisContext,
		key,
		"true",
		10*time.Minute,
	).Err()
}

func IsEmailVerified(email string) bool {
	key := "verified:" + email

	result, err := database.RedisClient.Get(
		database.RedisContext,
		key,
	).Result()

	return err == nil && result == "true"
}