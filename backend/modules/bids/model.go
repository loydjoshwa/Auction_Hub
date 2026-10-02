package bids

import (
	"time"

	"auction-hub/modules/auctions"
	"auction-hub/modules/products"
	"auction-hub/modules/users"
)

type Bid struct {
	ID        uint              `gorm:"primaryKey" json:"id"`
	AuctionID uint              `gorm:"not null;index" json:"auctionId"`
	UserID    uint              `gorm:"not null;index" json:"userId"`
	Amount    float64           `gorm:"not null" json:"amount"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
	User      *users.User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Auction   *auctions.Auction `gorm:"foreignKey:AuctionID" json:"auction,omitempty"`
}

type MyBidItem struct {
	AuctionID     uint              `json:"auctionId"`
	AuctionStatus string            `json:"auctionStatus"`
	Title         string            `json:"title"`
	CurrentPrice  float64           `json:"currentPrice"`
	MyHighestBid  float64           `json:"myHighestBid"`
	EndTime       time.Time         `json:"endTime"`
	UserStatus    string            `json:"userStatus"`
	StatusMessage string            `json:"statusMessage"`
	Product       *products.Product `json:"product,omitempty"`
}
