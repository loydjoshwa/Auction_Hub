package admin

import (
	"auction-hub/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {

	repository := NewRepository()
	service := NewService(repository)
	controller := NewController(service)

	adminRoutes := router.Group("/admin")
	adminRoutes.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"))
	{
		adminRoutes.GET("/dashboard", controller.GetDashboardAnalytics)
		adminRoutes.GET("/users", controller.GetAllUsers)
		adminRoutes.PATCH("/users/:id/block", controller.BlockUser)
		adminRoutes.PATCH("/users/:id/unblock", controller.UnblockUser)

		// Manage Products
		adminRoutes.GET("/products", controller.GetAllProducts)
		adminRoutes.DELETE("/products/:id", controller.DeleteProduct)

		// Manage Auctions
		adminRoutes.GET("/auctions", controller.GetAllAuctions)
		adminRoutes.PATCH("/auctions/:id/cancel", controller.CancelAuction)
		adminRoutes.PATCH("/auctions/:id/pause", controller.PauseAuction)
		adminRoutes.PATCH("/auctions/:id/resume", controller.ResumeAuction)

		// Manage Bids
		adminRoutes.GET("/bids", controller.GetAllBids)

		// Manage Orders
		adminRoutes.GET("/orders", controller.GetAllOrders)
		adminRoutes.GET("/orders/:id", controller.GetAdminOrderByID)
	}
}
