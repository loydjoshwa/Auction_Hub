package orders

import (
	"auction-hub/middleware"
	"auction-hub/modules/notifications"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	// Repository
	repo := NewRepository()
	notificationRepo := notifications.NewRepository()

	// Notification service
	notificationService := notifications.NewService(notificationRepo)

	// Order service
	service := NewService(repo)

	// Connect notification service
	service.NotificationService = notificationService

	// Controller
	controller := NewController(service)

	// Order routes
	orderRoutes := router.Group("/orders")
	orderRoutes.Use(middleware.AuthMiddleware())

	{
		orderRoutes.GET("", controller.GetUserOrders)
		orderRoutes.GET("/my-orders", controller.GetMyOrders)
		orderRoutes.GET("/seller", controller.GetSellerOrders)
		orderRoutes.GET("/buyer", controller.GetBuyerOrders)
		orderRoutes.GET("/:id", controller.GetOrderByID)
		orderRoutes.PUT("/:id/address", controller.UpdateDeliveryAddress)
		orderRoutes.PUT("/:id/status", controller.UpdateOrderStatus)
		orderRoutes.PATCH("/:id/pack", controller.MarkAsPacked)
		orderRoutes.PATCH("/:id/ship", controller.MarkAsShipped)
		orderRoutes.PATCH("/:id/deliver", controller.MarkAsDelivered)
	}
}