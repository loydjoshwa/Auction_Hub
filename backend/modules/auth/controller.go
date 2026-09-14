package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	Service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{
		Service: service,
	}
}

func (c *Controller) Register(ctx *gin.Context) {

	var request RegisterRequest

	// Read JSON request
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid registration data",
			"error":   err.Error(),
		})
		return
	}

	// Register user
	user, err := c.Service.Register(request)

	if err != nil {

		if err.Error() == "email already registered" {
			ctx.JSON(http.StatusConflict, gin.H{
				"message": "Email already registered",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to register user",
		})
		return
	}

	// Send successful response
	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (c *Controller) SendOTP(ctx *gin.Context) {

	var request SendOTPRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid email",
			"error":   err.Error(),
		})
		return
	}

	err := c.Service.SendOTP(request.Email)

	if err != nil {
		if err.Error() == "email already registered" {
			ctx.JSON(http.StatusConflict, gin.H{
				"message": "Email already registered",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to send OTP",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "OTP sent successfully",
	})
}

func (c *Controller) VerifyOTP(ctx *gin.Context) {

	var request VerifyOTPRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid OTP data",
			"error":   err.Error(),
		})
		return
	}

	err := c.Service.VerifyOTP(request.Email, request.OTP)

	if err != nil {

		if err.Error() == "OTP expired or not found" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "OTP expired or not found",
			})
			return
		}

		if err.Error() == "invalid OTP" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid OTP",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to verify OTP",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "OTP verified successfully",
	})
}
func (c *Controller) Login(ctx *gin.Context) {

	var request LoginRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid login data",
			"error":   err.Error(),
		})
		return
	}

	user, token, err := c.Service.Login(request)

	if err != nil {

		if err.Error() == "invalid email or password" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid email or password",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Login failed",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (c *Controller) ForgotPassword(ctx *gin.Context) {
	var request ForgotPasswordRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid email address",
			"error":   err.Error(),
		})
		return
	}

	err := c.Service.SendForgotPasswordOTP(request.Email)
	if err != nil {
		if err.Error() == "user not found" {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "No account found with this email address",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to send reset OTP. Please try again.",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Reset OTP sent successfully to your email",
	})
}

func (c *Controller) ResetPassword(ctx *gin.Context) {
	var request ResetPasswordRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid reset data. Ensure password is at least 6 characters.",
			"error":   err.Error(),
		})
		return
	}

	err := c.Service.ResetPassword(request)
	if err != nil {
		if err.Error() == "OTP expired or not found" || err.Error() == "invalid OTP" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to reset password. Please try again.",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. You can now log in with your new password.",
	})
}