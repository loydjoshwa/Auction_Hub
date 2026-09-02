package chat

import "time"

type Conversation struct {
	ID        uint      `gorm:"primaryKey"`
	AuctionID uint      `gorm:"not null;index"`
	BuyerID   uint      `gorm:"not null;index"`
	SellerID  uint      `gorm:"not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Message struct {
	ID             uint      `gorm:"primaryKey"`
	ConversationID uint      `gorm:"not null;index"`
	SenderID       uint      `gorm:"not null;index"`
	Message        string    `gorm:"not null"`
	IsRead         bool      `gorm:"default:false;index"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}