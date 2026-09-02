package users

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"not null"`
	Email     string    `gorm:"unique;not null"`
	Password  string    `gorm:"not null"`
	Role      string    `gorm:"not null;default:user"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Watchlist struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null;index"`
	AuctionID uint      `gorm:"not null;index"`
	CreatedAt time.Time
}