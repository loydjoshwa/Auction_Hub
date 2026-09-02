package sellers

import "time"

type Seller struct {
	ID                  uint      `gorm:"primaryKey"`
	UserID              uint      `gorm:"not null;uniqueIndex"`
	BusinessName        string
	BusinessDescription string
	VerificationStatus  string    `gorm:"not null;default:pending;index"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type SellerVerification struct {
	ID             uint      `gorm:"primaryKey"`
	SellerID       uint      `gorm:"not null;uniqueIndex"`
	DocumentType   string    `gorm:"not null"`
	DocumentNumber string    `gorm:"not null"`
	DocumentURL    string
	Status         string    `gorm:"not null;default:pending;index"`
	Remarks        string
	VerifiedAt     *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}