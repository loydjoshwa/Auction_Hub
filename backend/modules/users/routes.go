package users

import (
	"auction-hub/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {

	repository := NewRepository()
	service := NewService(repository)
	controller := NewController(service)

	userRoutes := router.Group("/users")
	{
		userRoutes.GET(
			"/profile",
			middleware.AuthMiddleware(),
			controller.GetProfile,
		)

		userRoutes.PUT(
			"/profile",
			middleware.AuthMiddleware(),
			controller.UpdateProfile,
		)
	}
}