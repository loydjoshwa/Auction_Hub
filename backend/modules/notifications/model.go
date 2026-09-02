package notifications

import "time"

type Notification struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null;index"`
	Type      string    `gorm:"not null"`
	Title     string    `gorm:"not null"`
	Message   string    `gorm:"not null"`
	IsRead    bool      `gorm:"default:false;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
}