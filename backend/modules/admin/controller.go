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

// Helper to safely extract user_id from Gin context
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
	case int64:
		return uint(v), true
	default:
		return 0, false
	}
}

// GetDashboardAnalytics returns dashboard statistics for total, active, and blocked users.
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