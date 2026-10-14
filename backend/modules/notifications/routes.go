package notifications

import (
	"auction-hub/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	repository := NewRepository()
	service := NewService(repository)
	controller := NewController(service)

	notificationRoutes := router.Group("/notifications")
	notificationRoutes.Use(middleware.AuthMiddleware())
	{
		notificationRoutes.GET("", controller.GetNotifications)
		notificationRoutes.GET("/unread-count", controller.GetUnreadCount)
		notificationRoutes.PATCH("/:id/read", controller.MarkAsRead)
		notificationRoutes.PATCH("/read-all", controller.MarkAllAsRead)
	}
}