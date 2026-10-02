package chat

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

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

type SendMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

// GET /api/chat/auction/:auctionId
func (c *Controller) GetOrCreateConversation(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("auctionId")
	auctionID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid auction ID",
		})
		return
	}

	conv, err := c.Service.GetOrCreateConversation(uint(auctionID), userID)
	if err != nil {
		if errors.Is(err, ErrUnauthorizedChat) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrNoWinnerYet) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to access conversation",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"conversation": conv,
	})
}

// GET /api/chat/conversation/:id/messages
func (c *Controller) GetMessages(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	convID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid conversation ID",
		})
		return
	}

	messages, conv, err := c.Service.GetMessages(uint(convID), userID)
	if err != nil {
		if errors.Is(err, ErrUnauthorizedChat) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrConversationNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Conversation not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch messages",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"messages":     messages,
		"conversation": conv,
	})
}

// POST /api/chat/conversation/:id/messages
func (c *Controller) SendMessage(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	convID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid conversation ID",
		})
		return
	}

	var req SendMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Message content cannot be empty",
		})
		return
	}

	msg, err := c.Service.SendMessage(uint(convID), userID, req.Message)
	if err != nil {
		if errors.Is(err, ErrUnauthorizedChat) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": err.Error(),
			})
			return
		}
		if errors.Is(err, ErrConversationNotFound) {
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
		"message": "Message sent successfully",
		"data":    msg,
	})
}
