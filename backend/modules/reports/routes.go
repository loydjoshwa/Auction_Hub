package reports

import (
	"auction-hub/middleware"
	"auction-hub/modules/auctions"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	repRepo := NewRepository()
	aucRepo := auctions.NewRepository()
	service := NewService(repRepo, aucRepo)
	controller := NewController(service)

	userReports := router.Group("/reports")
	userReports.Use(middleware.AuthMiddleware())
	{
		userReports.POST("", controller.CreateReport)
		userReports.GET("/my-reports", controller.GetUserReports)
	}

	adminReports := router.Group("/admin/reports")
	adminReports.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"))
	{
		adminReports.GET("", controller.GetAllReports)
		adminReports.GET("/:id", controller.GetReportByID)
		adminReports.PATCH("/:id/status", controller.UpdateReportStatus)
	}
}
