package auctions

import (
	"auction-hub/middleware"
	"auction-hub/modules/notifications"
	"auction-hub/modules/products"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {

	// Repositories
	auctionRepo := NewRepository()
	productRepo := products.NewRepository()
	notificationRepo := notifications.NewRepository()

	// Notification service
	notificationService := notifications.NewService(notificationRepo)

	// Connect notification service to auction repository
	auctionRepo.NotificationService = notificationService

	// Auction service
	service := NewService(
		auctionRepo,
		productRepo,
	)

	// Controller
	controller := NewController(service)

	// Auction routes
	auctionRoutes := router.Group("/auctions")
	auctionRoutes.Use(middleware.AuthMiddleware())

	{
		auctionRoutes.POST("", controller.CreateAuction)
		auctionRoutes.GET("", controller.GetActiveAuctions)
		auctionRoutes.GET("/my-auctions", controller.GetMyAuctions)
		auctionRoutes.GET("/seller", controller.GetMyAuctions)
		auctionRoutes.GET("/won", controller.GetWonAuctions)
		auctionRoutes.GET("/:id", controller.GetAuctionByID)
		auctionRoutes.PATCH("/:id/end", controller.EndAuction)
	}
}