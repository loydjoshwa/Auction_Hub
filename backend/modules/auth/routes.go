package auth

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.RouterGroup) {

	repository := NewRepository()
	service := NewService(repository)
	controller := NewController(service)

	authRoutes := router.Group("/auth")
	{
		authRoutes.POST("/register", controller.Register)
		authRoutes.POST("/send-otp", controller.SendOTP)
		authRoutes.POST("/verify-otp", controller.VerifyOTP)
		authRoutes.POST("/login", controller.Login)
		authRoutes.POST("/forgot-password", controller.ForgotPassword)
		authRoutes.POST("/reset-password", controller.ResetPassword)
	}
}