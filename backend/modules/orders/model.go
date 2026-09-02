package orders

import "time"

type Order struct {
	ID          uint      `gorm:"primaryKey"`
	AuctionID   uint      `gorm:"not null;uniqueIndex"`
	BuyerID     uint      `gorm:"not null;index"`
	SellerID    uint      `gorm:"not null;index"`
	FinalAmount float64   `gorm:"not null"`
	Status      string    `gorm:"not null;default:pending;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}