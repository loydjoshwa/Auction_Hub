package admin

import "time"

type AdminActionLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	AdminUserID uint      `gorm:"not null;index" json:"adminUserId"`
	ActionType  string    `gorm:"not null;index" json:"actionType"` // e.g. "REMOVE_PRODUCT", "CANCEL_AUCTION", "CANCEL_ORDER", "BLOCK_USER"
	EntityType  string    `gorm:"not null;index" json:"entityType"` // e.g. "PRODUCT", "AUCTION", "ORDER", "USER"
	EntityID    uint      `gorm:"not null;index" json:"entityId"`
	Reason      string    `gorm:"type:text;not null" json:"reason"`
	CreatedAt   time.Time `json:"createdAt"`
}
