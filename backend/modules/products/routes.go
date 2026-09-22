package products

import (
	"auction-hub/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	repository := NewRepository()
	service := NewService(repository)
	controller := NewController(service)

	productRoutes := router.Group("/products")
	productRoutes.Use(middleware.AuthMiddleware())
	{
		productRoutes.GET("/my", controller.GetMyProducts)
		productRoutes.POST("", controller.CreateProduct)
		productRoutes.GET("/:id", controller.GetProductByID)
		productRoutes.PUT("/:id", controller.UpdateProduct)
		productRoutes.DELETE("/:id", controller.DeleteProduct)
	}
}
