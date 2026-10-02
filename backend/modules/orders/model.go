package orders

import (
	"time"

	"auction-hub/modules/auctions"
	"auction-hub/modules/users"
)

type Order struct {
	ID              uint                   `gorm:"primaryKey" json:"id"`
	AuctionID       uint                   `gorm:"not null;uniqueIndex" json:"auctionId"`
	BuyerID         uint                   `gorm:"not null;index" json:"buyerId"`
	SellerID        uint                   `gorm:"not null;index" json:"sellerId"`
	FinalAmount     float64                `gorm:"not null" json:"finalAmount"`
	DeliveryAddress string                 `gorm:"type:text" json:"deliveryAddress"`
	Status          string                 `gorm:"not null;default:'confirmed';index" json:"status"`
	CreatedAt       time.Time              `json:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt"`
	Auction         *auctions.Auction      `gorm:"foreignKey:AuctionID" json:"auction,omitempty"`
	Buyer           *users.User            `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	Seller          *users.User            `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
	TrackingHistory []OrderTrackingHistory `gorm:"foreignKey:OrderID" json:"trackingHistory,omitempty"`
}

type OrderTrackingHistory struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrderID     uint      `gorm:"not null;index" json:"orderId"`
	Status      string    `gorm:"not null" json:"status"`
	UpdatedBy   string    `gorm:"not null" json:"updatedBy"` // "System", "Buyer", "Seller", "Admin"
	UpdatedByID uint      `gorm:"not null" json:"updatedById"`
	Reason      string    `gorm:"type:text" json:"reason"`
	CreatedAt   time.Time `json:"createdAt"`
}
