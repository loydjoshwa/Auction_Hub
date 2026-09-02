package bids

import "time"

type Bid struct {
	ID        uint      `gorm:"primaryKey"`
	AuctionID uint      `gorm:"not null;index"`
	UserID    uint      `gorm:"not null;index"`
	Amount    float64   `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}