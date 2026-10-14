package chat

import (
	"auction-hub/middleware"
	"auction-hub/modules/notifications"
	"auction-hub/modules/orders"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	// Repositories
	chatRepo := NewRepository()
	orderRepo := orders.NewRepository()
	notificationRepo := notifications.NewRepository()

	// Services
	notificationService := notifications.NewService(notificationRepo)

	service := NewService(chatRepo, orderRepo)

	// Connect notification service
	service.NotificationService = notificationService

	// Controller
	controller := NewController(service)

	// Chat routes
	chatRoutes := router.Group("/chat")
	chatRoutes.Use(middleware.AuthMiddleware())

	{
		chatRoutes.GET("/auction/:auctionId", controller.GetOrCreateConversation)
		chatRoutes.GET("/conversation/:id/messages", controller.GetMessages)
		chatRoutes.POST("/conversation/:id/messages", controller.SendMessage)
	}
}