package reports

import "time"

type Report struct {
	ID          uint      `gorm:"primaryKey"`
	ReporterID  uint      `gorm:"not null;index"`
	ReportedID  uint      `gorm:"not null;index"`
	AuctionID   *uint     `gorm:"index"`
	Reason      string    `gorm:"not null"`
	Description string
	Status      string    `gorm:"not null;default:pending;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}