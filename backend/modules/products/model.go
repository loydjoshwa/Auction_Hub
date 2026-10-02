package products

import (
	"time"

	"auction-hub/modules/users"
)

type Product struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	UserID      uint        `gorm:"not null;index" json:"userId"`
	Name        string      `gorm:"not null" json:"name"`
	Description string      `gorm:"not null" json:"description"`
	ImageURL    string      `gorm:"not null" json:"imageUrl"`
	Status      string      `gorm:"not null;default:'Ready for Auction'" json:"status"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
	User        *users.User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
