package bids

import (
	"time"

	"auction-hub/modules/users"
)

type Bid struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	AuctionID uint        `gorm:"not null;index" json:"auctionId"`
	UserID    uint        `gorm:"not null;index" json:"userId"`
	Amount    float64     `gorm:"not null" json:"amount"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	User      *users.User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}