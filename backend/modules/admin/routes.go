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
	}
}