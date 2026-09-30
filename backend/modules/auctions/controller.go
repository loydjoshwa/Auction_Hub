package auctions

import (
	"errors"
	"net/http"
	"strconv"

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

type CreateAuctionRequest struct {
	ProductID     uint    `json:"product_id" binding:"required"`
	StartingPrice float64 `json:"starting_price" binding:"required"`
	Duration      string  `json:"duration" binding:"required"`
}

// getUserIDFromContext gets the authenticated user's ID
// that was stored by AuthMiddleware.
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

	case uint64:
		return uint(v), true

	case int64:
		return uint(v), true

	default:
		return 0, false
	}
}

// POST /api/auctions
//
// Creates an auction for a product owned by the
// currently authenticated user.
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
			"message": "Product ID, starting price, and duration are required",
		})
		return
	}

	auction, err := c.Service.CreateAuction(
		userID,
		req.ProductID,
		req.StartingPrice,
		req.Duration,
	)

	if err != nil {

		switch {

		case errors.Is(err, ErrUnauthorizedProduct):
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return

		case errors.Is(err, ErrProductNotFound):
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return

		case errors.Is(err, ErrAlreadyInAuction):
			ctx.JSON(http.StatusConflict, gin.H{
				"message": err.Error(),
			})
			return

		case errors.Is(err, ErrInvalidPrice),
			errors.Is(err, ErrInvalidDuration):
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return

		default:
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to create auction",
			})
			return
		}
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Auction created successfully",
		"auction": auction,
	})
}

// GET /api/auctions
//
// Returns all active auctions.
// This endpoint can be accessed by all users.
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

// GET /api/auctions/:id
//
// Returns the details of one auction.
func (c *Controller) GetAuctionByID(ctx *gin.Context) {

	idParam := ctx.Param("id")

	auctionID, err := strconv.ParseUint(idParam, 10, 64)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	auction, err := c.Service.GetAuctionByID(uint(auctionID))

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Auction not found",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch auction",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"auction": auction,
	})
}