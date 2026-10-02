package auctions

import (
	"auction-hub/middleware"
	"auction-hub/modules/products"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {

	// Repositories
	auctionRepo := NewRepository()
	productRepo := products.NewRepository()

	// Service
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
		// Create an auction for the logged-in user's product
		auctionRoutes.POST("", controller.CreateAuction)

		// Get all active auctions
		// Any authenticated user can view these.
		auctionRoutes.GET("", controller.GetActiveAuctions)

		// Get seller's created auctions
		auctionRoutes.GET("/my-auctions", controller.GetMyAuctions)
		auctionRoutes.GET("/seller", controller.GetMyAuctions)

		// Get auctions won by buyer
		auctionRoutes.GET("/won", controller.GetWonAuctions)

		// Get details of a specific auction
		auctionRoutes.GET("/:id", controller.GetAuctionByID)

		// End an active auction manually (Seller only)
		auctionRoutes.PATCH("/:id/end", controller.EndAuction)
	}
}
