package chat

import (
	"auction-hub/middleware"
	"auction-hub/modules/orders"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	chatRepo := NewRepository()
	orderRepo := orders.NewRepository()

	service := NewService(chatRepo, orderRepo)
	controller := NewController(service)

	chatRoutes := router.Group("/chat")
	chatRoutes.Use(middleware.AuthMiddleware())

	{
		chatRoutes.GET("/auction/:auctionId", controller.GetOrCreateConversation)
		chatRoutes.GET("/conversation/:id/messages", controller.GetMessages)
		chatRoutes.POST("/conversation/:id/messages", controller.SendMessage)
	}
}
