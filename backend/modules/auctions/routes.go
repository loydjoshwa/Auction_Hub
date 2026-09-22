package auctions

import (
	"auction-hub/middleware"
	"auction-hub/modules/products"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	auctionRepo := NewRepository()
	productRepo := products.NewRepository()
	service := NewService(auctionRepo, productRepo)
	controller := NewController(service)

	auctionRoutes := router.Group("/auctions")
	auctionRoutes.Use(middleware.AuthMiddleware())
	{
		auctionRoutes.POST("", controller.CreateAuction)
	}
}