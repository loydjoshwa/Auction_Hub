package orders

import (
	"auction-hub/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	repo := NewRepository()
	service := NewService(repo)
	controller := NewController(service)

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
