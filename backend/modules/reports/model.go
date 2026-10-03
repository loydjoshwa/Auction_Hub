package reports

import (
	"time"

	"auction-hub/modules/auctions"
	"auction-hub/modules/users"
)

type Report struct {
	ID          uint              `gorm:"primaryKey" json:"id"`
	ReporterID  uint              `gorm:"not null;index" json:"reporterId"`
	ReportedID  uint              `gorm:"not null;index" json:"reportedId"`
	AuctionID   uint              `gorm:"not null;index" json:"auctionId"`
	Reason      string            `gorm:"not null" json:"reason"`
	Description string            `gorm:"type:text;not null" json:"description"`
	Status      string            `gorm:"not null;default:pending;index" json:"status"` // pending, reviewing, resolved, rejected
	AdminReason string            `gorm:"type:text" json:"adminReason,omitempty"`
	AdminID     *uint             `gorm:"index" json:"adminId,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`

	Reporter *users.User       `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	Reported *users.User       `gorm:"foreignKey:ReportedID" json:"reportedUser,omitempty"`
	Auction  *auctions.Auction `gorm:"foreignKey:AuctionID" json:"auction,omitempty"`
	Admin    *users.User       `gorm:"foreignKey:AdminID" json:"admin,omitempty"`
}
