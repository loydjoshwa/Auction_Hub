package notifications

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	Service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{
		Service: service,
	}
}

// getNotificationUserID safely extracts the authenticated user ID.
func getNotificationUserID(ctx *gin.Context) (uint, bool) {
	value, exists := ctx.Get("user_id")
	if !exists {
		return 0, false
	}

	switch v := value.(type) {
	case uint:
		if v > 0 {
			return v, true
		}

	case uint64:
		if v > 0 {
			return uint(v), true
		}

	case int:
		if v > 0 {
			return uint(v), true
		}

	case int64:
		if v > 0 {
			return uint(v), true
		}

	case float64:
		if v > 0 && v == float64(uint(v)) {
			return uint(v), true
		}

	case string:
		id, err := strconv.ParseUint(v, 10, 32)
		if err == nil && id > 0 {
			return uint(id), true
		}
	}

	return 0, false
}

// GET /api/notifications
func (c *Controller) GetNotifications(ctx *gin.Context) {
	userID, ok := getNotificationUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated or invalid user ID",
		})
		return
	}

	notifications, err := c.Service.GetNotifications(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch notifications",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":       "Notifications fetched successfully",
		"notifications": notifications,
	})
}

// GET /api/notifications/unread-count
func (c *Controller) GetUnreadCount(ctx *gin.Context) {
	userID, ok := getNotificationUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated or invalid user ID",
		})
		return
	}

	count, err := c.Service.GetUnreadCount(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch unread count",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"unreadCount": count,
	})
}

// PATCH /api/notifications/:id/read
func (c *Controller) MarkAsRead(ctx *gin.Context) {
	userID, ok := getNotificationUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated or invalid user ID",
		})
		return
	}

	notificationID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil || notificationID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid notification ID",
		})
		return
	}

	err = c.Service.MarkAsRead(userID, uint(notificationID))
	if err != nil {
		if errors.Is(err, ErrNotificationNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Notification not found",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to mark notification as read",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Notification marked as read",
	})
}

// PATCH /api/notifications/read-all
func (c *Controller) MarkAllAsRead(ctx *gin.Context) {
	userID, ok := getNotificationUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated or invalid user ID",
		})
		return
	}

	if err := c.Service.MarkAllAsRead(userID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to mark all notifications as read",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "All notifications marked as read",
	})
}