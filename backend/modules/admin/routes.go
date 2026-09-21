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
	{
		adminRoutes.GET(
			"/users",
			middleware.AuthMiddleware(),
			middleware.RoleMiddleware("admin"),
			controller.GetAllUsers,
		)
	}
}