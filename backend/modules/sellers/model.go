package sellers

import "time"

type Seller struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	StoreName   string    `gorm:"size:100;not null" json:"store_name"`
	Description string    `gorm:"type:text" json:"description"`
	Phone       string    `gorm:"size:20" json:"phone"`
	Logo        string    `gorm:"size:255" json:"logo"`
	Banner      string    `gorm:"size:255" json:"banner"`
	Status      string    `gorm:"size:20;default:'pending'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SellerCreateRequest struct {
	StoreName   string `json:"store_name" binding:"required"`
	Description string `json:"description"`
	Phone       string `json:"phone"`
}

type SellerUpdateRequest struct {
	StoreName   string `json:"store_name"`
	Description string `json:"description"`
	Phone       string `json:"phone"`
}