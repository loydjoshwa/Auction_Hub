package bids

import (
	"errors"
	"net/http"
	"strconv"

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

type CreateBidRequest struct {
	AuctionID uint    `json:"auction_id" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
}

// getUserIDFromContext gets the authenticated user's ID
// stored by AuthMiddleware.
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

// POST /api/bids
//
// Places a bid on an active auction.
func (c *Controller) CreateBid(ctx *gin.Context) {

	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var req CreateBidRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Auction ID and bid amount are required",
		})
		return
	}

	bid, auction, err := c.Service.CreateBid(userID, req.AuctionID, req.Amount)
	if err != nil {
		switch {
		case errors.Is(err, ErrAuctionNotFound):
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return

		case errors.Is(err, ErrSellerCannotBid):
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return

		case errors.Is(err, ErrAuctionNotActive),
			errors.Is(err, ErrAuctionEnded),
			errors.Is(err, ErrBidAmountTooLow),
			errors.Is(err, ErrInvalidBidAmount):
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return

		default:
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":      "Bid placed successfully",
		"bid":          bid,
		"currentPrice": auction.CurrentPrice,
	})
}

// GET /api/bids/auction/:auctionId
//
// Returns all bids placed on a specific auction, highest first.
func (c *Controller) GetBidsByAuctionID(ctx *gin.Context) {

	idParam := ctx.Param("auctionId")
	auctionID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	bids, err := c.Service.GetBidsByAuctionID(uint(auctionID))
	if err != nil {
		if errors.Is(err, ErrAuctionNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch bids",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"bids": bids,
	})
}