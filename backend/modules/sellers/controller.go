package sellers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Controller struct {
	Service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{
		Service: service,
	}
}

func (c *Controller) GetProfile(ctx *gin.Context) {

	userIDValue, exists := ctx.Get("user_id")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	userIDFloat, ok := userIDValue.(float64)

	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid user ID",
		})
		return
	}

	userID := uint(userIDFloat)

	seller, err := c.Service.GetSellerProfile(userID)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Seller profile not found",
				"is_seller": false,
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch seller profile",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":   "Seller profile fetched successfully",
		"is_seller": true,
		"seller":    seller,
	})
}

func (c *Controller) CreateProfile(ctx *gin.Context) {

	userIDValue, exists := ctx.Get("user_id")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	userIDFloat, ok := userIDValue.(float64)

	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid user ID",
		})
		return
	}

	userID := uint(userIDFloat)

	var request SellerCreateRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid seller data",
			"error":   err.Error(),
		})
		return
	}

	seller, err := c.Service.CreateSeller(userID, request)

	if err != nil {

		if err.Error() == "seller profile already exists" {
			ctx.JSON(http.StatusConflict, gin.H{
				"message": "Seller profile already exists",
			})
			return
		}

		if err.Error() == "store name is required" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Store name is required",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create seller profile",
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Seller profile created successfully",
		"seller":  seller,
	})
}

func (c *Controller) UpdateProfile(ctx *gin.Context) {

	userIDValue, exists := ctx.Get("user_id")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	userIDFloat, ok := userIDValue.(float64)

	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid user ID",
		})
		return
	}

	userID := uint(userIDFloat)

	var request SellerUpdateRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid seller data",
			"error":   err.Error(),
		})
		return
	}

	seller, err := c.Service.UpdateSeller(userID, request)

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Seller profile not found",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to update seller profile",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Seller profile updated successfully",
		"seller":  seller,
	})
}