package notifications

import (
	"errors"
)

var ErrNotificationNotFound = errors.New("notification not found")

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

// CreateNotification creates a notification for a user.
func (s *Service) CreateNotification(
	userID uint,
	notificationType string,
	title string,
	message string,
) error {
	notification := Notification{
		UserID:  userID,
		Type:    notificationType,
		Title:   title,
		Message: message,
		IsRead:  false,
	}

	return s.Repository.Create(&notification)
}

// GetNotifications returns all notifications belonging to a user.
func (s *Service) GetNotifications(
	userID uint,
) ([]Notification, error) {
	return s.Repository.GetByUserID(userID)
}

// GetUnreadCount returns the number of unread notifications.
func (s *Service) GetUnreadCount(
	userID uint,
) (int64, error) {
	return s.Repository.GetUnreadCount(userID)
}

// MarkAsRead marks one notification as read.
func (s *Service) MarkAsRead(
	userID uint,
	notificationID uint,
) error {
	return s.Repository.MarkAsRead(userID, notificationID)
}

// MarkAllAsRead marks all of a user's notifications as read.
func (s *Service) MarkAllAsRead(userID uint) error {
	return s.Repository.MarkAllAsRead(userID)
}