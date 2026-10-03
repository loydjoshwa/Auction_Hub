package reports

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

type CreateReportRequest struct {
	AuctionID   uint   `json:"auctionId" binding:"required"`
	Reason      string `json:"reason" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func (c *Controller) CreateReport(ctx *gin.Context) {
	reporterID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	var req CreateReportRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Reason and Description are required",
		})
		return
	}

	report, err := c.Service.CreateReport(reporterID, req.AuctionID, req.Reason, req.Description)
	if err != nil {
		if errors.Is(err, ErrReportAlreadyExists) || errors.Is(err, ErrReasonRequired) || errors.Is(err, ErrDescriptionRequired) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrAuctionNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to submit report",
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Report submitted successfully",
		"report":  report,
	})
}

func (c *Controller) GetUserReports(ctx *gin.Context) {
	reporterID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	reportsList, err := c.Service.GetUserReports(reporterID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch your reports",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "User reports fetched successfully",
		"reports": reportsList,
	})
}

func (c *Controller) GetAllReports(ctx *gin.Context) {
	search := ctx.Query("search")
	status := ctx.Query("status")
	sort := ctx.Query("sort")

	reportsList, err := c.Service.GetAllReports(search, status, sort)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch reports",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Reports fetched successfully",
		"reports": reportsList,
	})
}

func (c *Controller) GetReportByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	reportID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid report ID",
		})
		return
	}

	report, err := c.Service.GetReportByID(uint(reportID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Report not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch report",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Report fetched successfully",
		"report":  report,
	})
}

type UpdateReportStatusRequest struct {
	Status      string `json:"status" binding:"required"`
	AdminReason string `json:"adminReason" binding:"required"`
}

func (c *Controller) UpdateReportStatus(ctx *gin.Context) {
	adminID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	reportID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid report ID",
		})
		return
	}

	var req UpdateReportStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Status and Admin Reason/Note are required",
		})
		return
	}

	report, err := c.Service.UpdateReportStatus(adminID, uint(reportID), req.Status, req.AdminReason)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Report not found",
			})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Report status updated successfully",
		"report":  report,
	})
}
