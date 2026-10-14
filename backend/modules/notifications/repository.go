package notifications

import (
	"auction-hub/database"

	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

func NewRepository() *Repository {
	return &Repository{
		DB: database.DB,
	}
}

// Create saves a new notification.
func (r *Repository) Create(notification *Notification) error {
	return r.DB.Create(notification).Error
}

// GetByUserID returns all notifications belonging to a user.
func (r *Repository) GetByUserID(userID uint) ([]Notification, error) {
	var notifications []Notification

	err := r.DB.
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&notifications).Error

	if err != nil {
		return nil, err
	}

	return notifications, nil
}

// GetUnreadCount returns the number of unread notifications.
func (r *Repository) GetUnreadCount(userID uint) (int64, error) {
	var count int64

	err := r.DB.
		Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error

	return count, err
}

// MarkAsRead marks one notification as read.
// It returns an error if the notification does not exist
// or does not belong to the specified user.
func (r *Repository) MarkAsRead(userID uint, notificationID uint) error {
	result := r.DB.
		Model(&Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrNotificationNotFound
	}

	return nil
}

// MarkAllAsRead marks all unread notifications belonging to a user as read.
func (r *Repository) MarkAllAsRead(userID uint) error {
	return r.DB.
		Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}