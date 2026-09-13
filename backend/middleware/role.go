package middleware

import "github.com/gin-gonic/gin"

func RoleMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {

		role, exists := c.Get("role")

		if !exists {
			c.JSON(401, gin.H{
				"message": "User role not found",
			})
			c.Abort()
			return
		}

		if role != requiredRole {
			c.JSON(403, gin.H{
				"message": "Access denied",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}