package admin

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

// GetAllUsers returns all registered users.
// This endpoint is protected by AdminMiddleware in routes.go.
func (c *Controller) GetAllUsers(ctx *gin.Context) {

	users, err := c.Service.GetAllUsers()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch users",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Users fetched successfully",
		"users":   users,
	})
}