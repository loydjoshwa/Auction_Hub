package bids

import (
	"auction-hub/middleware"
	"auction-hub/modules/auctions"
	"auction-hub/modules/notifications"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	bidRepo := NewRepository()
	auctionRepo := auctions.NewRepository()
	notificationRepo := notifications.NewRepository()

	notificationService := notifications.NewService(notificationRepo)

	bidService := NewService(bidRepo, auctionRepo)
	bidService.NotificationService = notificationService

	bidController := NewController(bidService)

	bidRoutes := router.Group("/bids")
	bidRoutes.Use(middleware.AuthMiddleware())

	{
		bidRoutes.POST("", bidController.CreateBid)
		bidRoutes.GET("/my", bidController.GetMyBids)
		bidRoutes.GET("/my-bids", bidController.GetMyBids)
		bidRoutes.GET("/auction/:auctionId", bidController.GetBidsByAuctionID)
	}
}