package categories

import "time"

type Category struct {
	ID          uint      `gorm:"primaryKey"`
	Name        string    `gorm:"unique;not null"`
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}