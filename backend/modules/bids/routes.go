package bids

import (
	"auction-hub/middleware"
	"auction-hub/modules/auctions"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {

	// Repositories
	bidRepo := NewRepository()
	auctionRepo := auctions.NewRepository()

	// Service
	service := NewService(
		bidRepo,
		auctionRepo,
	)

	// Controller
	controller := NewController(service)

	// Bid routes
	bidRoutes := router.Group("/bids")
	bidRoutes.Use(middleware.AuthMiddleware())

	{
		// Place a bid
		bidRoutes.POST("", controller.CreateBid)

		// Get user's bid listings
		bidRoutes.GET("/my", controller.GetMyBids)
		bidRoutes.GET("/my-bids", controller.GetMyBids)

		// Get bid history for an auction
		bidRoutes.GET("/auction/:auctionId", controller.GetBidsByAuctionID)
	}
}
