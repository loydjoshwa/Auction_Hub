package auth

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendOTPEmail(toEmail string, otp string) error {

	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")

	auth := smtp.PlainAuth(
		"",
		username,
		password,
		host,
	)

	subject := "Auction Hub - Email Verification OTP"

	body := fmt.Sprintf(
		"Your Auction Hub verification OTP is: %s\n\nThis OTP is valid for 5 minutes.",
		otp,
	)

	message := []byte(
		"From: AuctionHub <" + username + ">\r\n" +
			"To: " + toEmail + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"\r\n" +
			body,
	)

	return smtp.SendMail(
		host+":"+port,
		auth,
		username,
		[]string{toEmail},
		message,
	)
}

func TestEmail() error {
	return SendOTPEmail(
		"YOUR_EMAIL@gmail.com",
		"123456",
	)
}