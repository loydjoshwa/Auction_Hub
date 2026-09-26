package auctions

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

type CreateAuctionRequest struct {
	ProductID     uint    `json:"product_id" binding:"required"`
	StartingPrice float64 `json:"starting_price" binding:"required"`
	Duration      string  `json:"duration" binding:"required"`
}

func getUserIDFromContext(ctx *gin.Context) (uint, bool) {
	val, exists := ctx.Get("user_id")
	if !exists {
		return 0, false
	}

	switch v := val.(type) {
	case float64:
		return uint(v), true
	case uint:
		return v, true
	case int:
		return uint(v), true
	default:
		return 0, false
	}
}

// POST /api/auctions
func (c *Controller) CreateAuction(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var req CreateAuctionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request payload. Starting price, duration, and product ID are required.",
		})
		return
	}

	auction, err := c.Service.CreateAuction(userID, req.ProductID, req.StartingPrice, req.Duration)
	if err != nil {
		if err == ErrUnauthorizedProduct {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}

		if err == ErrProductNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Auction created successfully",
		"auction": auction,
	})
}

// GET /api/auctions
func (c *Controller) GetActiveAuctions(ctx *gin.Context) {
	auctions, err := c.Service.GetActiveAuctions()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch active auctions",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"auctions": auctions,
	})
}