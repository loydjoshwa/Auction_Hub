package chat

import (
	"time"

	"auction-hub/modules/users"
)

type Conversation struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	AuctionID uint        `gorm:"not null;index" json:"auctionId"`
	BuyerID   uint        `gorm:"not null;index" json:"buyerId"`
	SellerID  uint        `gorm:"not null;index" json:"sellerId"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	Buyer     *users.User `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	Seller    *users.User `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
}

type Message struct {
	ID             uint        `gorm:"primaryKey" json:"id"`
	ConversationID uint        `gorm:"not null;index" json:"conversationId"`
	SenderID       uint        `gorm:"not null;index" json:"senderId"`
	Message        string      `gorm:"not null" json:"message"`
	IsRead         bool        `gorm:"default:false;index" json:"isRead"`
	CreatedAt      time.Time   `json:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt"`
	Sender         *users.User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}
