package admin

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

// GetDashboardAnalytics returns dashboard statistics for users, products, auctions, bids, and orders.
func (c *Controller) GetDashboardAnalytics(ctx *gin.Context) {
	analytics, err := c.Service.GetDashboardAnalytics()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch dashboard analytics",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":   "Dashboard analytics fetched successfully",
		"analytics": analytics,
	})
}

// GetAllUsers returns all registered users with optional search and status filter parameters.
func (c *Controller) GetAllUsers(ctx *gin.Context) {
	search := ctx.Query("search")
	status := ctx.Query("status")

	usersList, err := c.Service.GetAllUsers(search, status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch users",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Users fetched successfully",
		"users":   usersList,
	})
}

// BlockUser blocks a user account.
func (c *Controller) BlockUser(ctx *gin.Context) {
	adminUserID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid user ID",
		})
		return
	}

	updatedUser, err := c.Service.BlockUser(adminUserID, uint(targetID))
	if err != nil {
		if err.Error() == "You cannot block your own account." {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "You cannot block your own account.",
			})
			return
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "User not found",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to block user",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "User blocked successfully",
		"user":    updatedUser,
	})
}

// UnblockUser unblocks a user account.
func (c *Controller) UnblockUser(ctx *gin.Context) {
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid user ID",
		})
		return
	}

	updatedUser, err := c.Service.UnblockUser(uint(targetID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "User not found",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to unblock user",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "User unblocked successfully",
		"user":    updatedUser,
	})
}

// GetAllProducts returns all products created by users with filters.
func (c *Controller) GetAllProducts(ctx *gin.Context) {
	search := ctx.Query("search")
	status := ctx.Query("status")
	inAuction := ctx.Query("inAuction")
	sort := ctx.Query("sort")

	productList, err := c.Service.GetAllProducts(search, status, inAuction, sort)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch products",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Products fetched successfully",
		"products": productList,
	})
}

// DeleteProduct deletes a product if not in an active auction.
func (c *Controller) DeleteProduct(ctx *gin.Context) {
	adminUserID, _ := getUserIDFromContext(ctx)
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid product ID",
		})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	_ = ctx.ShouldBindJSON(&reqBody)

	reason := reqBody.Reason
	if reason == "" {
		reason = ctx.Query("reason")
	}

	if reason == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "A reason is required to remove this product",
		})
		return
	}

	err = c.Service.DeleteProduct(adminUserID, uint(targetID), reason)
	if err != nil {
		if errors.Is(err, ErrProductInActiveAuction) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Product not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to delete product",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
	})
}

// GetAllAuctions returns all auctions with seller, product, and winner details.
func (c *Controller) GetAllAuctions(ctx *gin.Context) {
	search := ctx.Query("search")
	status := ctx.Query("status")
	sort := ctx.Query("sort")

	auctionList, err := c.Service.GetAllAuctions(search, status, sort)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch auctions",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Auctions fetched successfully",
		"auctions": auctionList,
	})
}

// CancelAuction allows admin to cancel/end an active auction.
func (c *Controller) CancelAuction(ctx *gin.Context) {
	adminUserID, _ := getUserIDFromContext(ctx)
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	_ = ctx.ShouldBindJSON(&reqBody)

	reason := reqBody.Reason
	if reason == "" {
		reason = ctx.Query("reason")
	}
	if reason == "" {
		reason = "Ended by administrator"
	}

	auction, err := c.Service.CancelAuction(adminUserID, uint(targetID), reason)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Auction not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to cancel auction",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Auction cancelled successfully",
		"auction": auction,
	})
}

// PauseAuction allows admin to pause an active auction with mandatory reason.
func (c *Controller) PauseAuction(ctx *gin.Context) {
	adminUserID, _ := getUserIDFromContext(ctx)
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	_ = ctx.ShouldBindJSON(&reqBody)

	reason := reqBody.Reason
	if reason == "" {
		reason = ctx.Query("reason")
	}

	if reason == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "A reason is required to pause this auction",
		})
		return
	}

	auction, err := c.Service.PauseAuction(adminUserID, uint(targetID), reason)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Auction not found",
			})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Auction paused successfully",
		"auction": auction,
	})
}

// ResumeAuction allows admin to resume a paused auction with mandatory reason.
func (c *Controller) ResumeAuction(ctx *gin.Context) {
	adminUserID, _ := getUserIDFromContext(ctx)
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	var reqBody struct {
		Reason string `json:"reason"`
	}
	_ = ctx.ShouldBindJSON(&reqBody)

	reason := reqBody.Reason
	if reason == "" {
		reason = ctx.Query("reason")
	}

	if reason == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "A reason is required to resume this auction",
		})
		return
	}

	auction, err := c.Service.ResumeAuction(adminUserID, uint(targetID), reason)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Auction not found",
			})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Auction resumed successfully",
		"auction": auction,
	})
}

// GetAllBids returns all bids placed on auctions with bidder & auction details.
func (c *Controller) GetAllBids(ctx *gin.Context) {
	search := ctx.Query("search")
	auctionID := ctx.Query("auctionId")
	bidderID := ctx.Query("bidderId")
	sort := ctx.Query("sort")

	bidsList, err := c.Service.GetAllBids(search, auctionID, bidderID, sort)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch bids",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Bids fetched successfully",
		"bids":    bidsList,
	})
}

// GetAllOrders returns all completed auction orders.
func (c *Controller) GetAllOrders(ctx *gin.Context) {
	search := ctx.Query("search")
	status := ctx.Query("status")
	sort := ctx.Query("sort")

	ordersList, err := c.Service.GetAllOrders(search, status, sort)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch orders",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Orders fetched successfully",
		"orders":  ordersList,
	})
}

// GetAdminOrderByID returns order details for admin.
func (c *Controller) GetAdminOrderByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	targetID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	order, err := c.Service.GetAdminOrderByID(uint(targetID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Order not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch order",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Order fetched successfully",
		"order":   order,
	})
}
