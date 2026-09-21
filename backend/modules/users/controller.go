package users

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	Service *Service
}

type UpdateProfileRequest struct {
	Name string `json:"name" binding:"required"`
}

func NewController(service *Service) *Controller {
	return &Controller{
		Service: service,
	}
}

func (c *Controller) GetProfile(ctx *gin.Context) {

	userID, exists := ctx.Get("user_id")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	user, err := c.Service.GetUserByID(userID)

	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"message": "User not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Profile fetched successfully",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (c *Controller) UpdateProfile(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var req UpdateProfileRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || len(strings.TrimSpace(req.Name)) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Valid profile name is required",
		})
		return
	}

	trimmedName := strings.TrimSpace(req.Name)

	user, err := c.Service.UpdateUserProfile(userID, trimmedName)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to update profile",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}