package orders

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

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

func getUserRoleFromContext(ctx *gin.Context) string {
	if val, exists := ctx.Get("role"); exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	if val, exists := ctx.Get("user_role"); exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

type AddressRequest struct {
	DeliveryAddress string `json:"deliveryAddress" binding:"required"`
}

// GET /api/orders
func (c *Controller) GetUserOrders(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	ordersMap, err := c.Service.GetMyOrders(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch orders",
		})
		return
	}

	buyerOrders := ordersMap["buyerOrders"]
	sellerOrders := ordersMap["sellerOrders"]

	allOrders := append([]Order{}, buyerOrders...)
	for _, sOrder := range sellerOrders {
		found := false
		for _, bOrder := range buyerOrders {
			if bOrder.ID == sOrder.ID {
				found = true
				break
			}
		}
		if !found {
			allOrders = append(allOrders, sOrder)
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"orders":       allOrders,
		"buyerOrders":  buyerOrders,
		"sellerOrders": sellerOrders,
	})
}

// GET /api/orders/my-orders
func (c *Controller) GetMyOrders(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	ordersMap, err := c.Service.GetMyOrders(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch user orders",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"buyerOrders":  ordersMap["buyerOrders"],
		"sellerOrders": ordersMap["sellerOrders"],
	})
}

// GET /api/orders/seller
func (c *Controller) GetSellerOrders(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	sellerOrders, err := c.Service.GetSellerOrders(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch seller orders",
		})
		return
	}

	if sellerOrders == nil {
		sellerOrders = []Order{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"sellerOrders": sellerOrders,
		"orders":       sellerOrders,
	})
}

// GET /api/orders/buyer
func (c *Controller) GetBuyerOrders(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	buyerOrders, err := c.Service.GetBuyerOrders(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch buyer orders",
		})
		return
	}

	if buyerOrders == nil {
		buyerOrders = []Order{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"buyerOrders": buyerOrders,
		"orders":      buyerOrders,
	})
}

// GET /api/orders/:id
func (c *Controller) GetOrderByID(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}
	userRole := getUserRoleFromContext(ctx)

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	order, err := c.Service.GetOrderByID(uint(id), userID, userRole)
	if err != nil {
		if errors.Is(err, ErrUnauthorizedOrder) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrOrderNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": err.Error(),
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch order",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}

// PUT /api/orders/:id/address
func (c *Controller) UpdateDeliveryAddress(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	var req AddressRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.DeliveryAddress) == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Delivery address is required",
		})
		return
	}

	order, err := c.Service.UpdateDeliveryAddress(uint(id), userID, req.DeliveryAddress)
	if err != nil {
		if errors.Is(err, ErrOnlyBuyerAddress) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrAddressLocked) {
			ctx.JSON(http.StatusConflict, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrOrderNotFound) {
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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Delivery address updated successfully",
		"order":   order,
	})
}

// PATCH /api/orders/:id/pack
func (c *Controller) MarkAsPacked(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}
	userRole := getUserRoleFromContext(ctx)

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	order, err := c.Service.MarkAsPacked(uint(id), userID, userRole)
	if err != nil {
		if errors.Is(err, ErrOnlySellerPack) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrOrderNotFound) {
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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Order marked as Packed",
		"order":   order,
	})
}

// PATCH /api/orders/:id/ship
func (c *Controller) MarkAsShipped(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}
	userRole := getUserRoleFromContext(ctx)

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	order, err := c.Service.MarkAsShipped(uint(id), userID, userRole)
	if err != nil {
		if errors.Is(err, ErrOnlySellerShip) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrOrderNotFound) {
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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Order marked as Shipped",
		"order":   order,
	})
}

// PATCH /api/orders/:id/deliver
func (c *Controller) MarkAsDelivered(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	order, err := c.Service.MarkAsDelivered(uint(id), userID)
	if err != nil {
		if errors.Is(err, ErrOnlyBuyerDeliver) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrOrderNotFound) {
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

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Order marked as Delivered",
		"order":   order,
	})
}

// PUT /api/orders/:id/status
func (c *Controller) UpdateOrderStatus(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}
	userRole := getUserRoleFromContext(ctx)

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid order ID",
		})
		return
	}

	var reqBody struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := ctx.ShouldBindJSON(&reqBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Status is required",
		})
		return
	}

	isAdmin := strings.ToLower(userRole) == "admin"
	if !isAdmin {
		ctx.JSON(http.StatusForbidden, gin.H{
			"message": "Only an administrator can update order status directly with a reason",
		})
		return
	}

	if strings.TrimSpace(reqBody.Reason) == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "A reason is required when an admin updates order status",
		})
		return
	}

	order, err := c.Service.UpdateOrderStatusByAdmin(uint(id), userID, reqBody.Status, reqBody.Reason)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Order status updated successfully",
		"order":   order,
	})
}
