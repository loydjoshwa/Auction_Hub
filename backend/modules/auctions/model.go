package auctions

import (
	"time"

	"auction-hub/modules/products"
	"auction-hub/modules/users"
)

type Auction struct {
	ID            uint              `gorm:"primaryKey" json:"id"`
	SellerID      uint              `gorm:"not null;index" json:"sellerId"`
	ProductID     uint              `gorm:"not null;index" json:"productId"`
	CategoryID    uint              `gorm:"default:1;index" json:"categoryId"`
	Title         string            `gorm:"not null" json:"title"`
	Description   string            `json:"description"`
	StartingPrice float64           `gorm:"not null" json:"startingPrice"`
	CurrentPrice  float64           `gorm:"not null" json:"currentPrice"`
	StartTime     time.Time         `gorm:"not null;index" json:"startTime"`
	EndTime       time.Time         `gorm:"not null;index" json:"endTime"`
	Status        string            `gorm:"not null;default:active;index" json:"status"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
	Product       *products.Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Seller        *users.User       `gorm:"foreignKey:SellerID" json:"seller,omitempty"`
}

type AuctionImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	AuctionID uint      `gorm:"not null;index" json:"auctionId"`
	ImageURL  string    `gorm:"not null" json:"imageUrl"`
	IsPrimary bool      `gorm:"default:false" json:"isPrimary"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}