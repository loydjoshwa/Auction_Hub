package auctions

import "time"

type Auction struct {
	ID            uint      `gorm:"primaryKey"`
	SellerID      uint      `gorm:"not null;index"`
	CategoryID    uint      `gorm:"not null;index"`
	Title         string    `gorm:"not null"`
	Description   string
	StartingPrice float64   `gorm:"not null"`
	CurrentPrice  float64   `gorm:"not null"`
	StartTime     time.Time `gorm:"not null;index"`
	EndTime       time.Time `gorm:"not null;index"`
	Status        string    `gorm:"not null;default:upcoming;index"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type AuctionImage struct {
	ID        uint      `gorm:"primaryKey"`
	AuctionID uint      `gorm:"not null;index"`
	ImageURL  string    `gorm:"not null"`
	IsPrimary bool      `gorm:"default:false"`
	CreatedAt time.Time
	UpdatedAt time.Time
}