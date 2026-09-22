package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"auction-hub/database"
	"auction-hub/modules/admin"
	"auction-hub/modules/auth"
	"auction-hub/modules/auctions"
	"auction-hub/modules/bids"
	"auction-hub/modules/categories"
	"auction-hub/modules/chat"
	"auction-hub/modules/notifications"
	"auction-hub/modules/orders"
	"auction-hub/modules/products"
	"auction-hub/modules/sellers"
	"auction-hub/modules/users"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	database.ConnectDB()
	database.ConnectRedis()

	var db *gorm.DB = database.DB

	err = db.AutoMigrate(
		&users.User{},
		&sellers.Seller{},
		&categories.Category{},
		&auctions.Auction{},
		&bids.Bid{},
		&auctions.AuctionImage{},
		&chat.Conversation{},
		&chat.Message{},
		&notifications.Notification{},
		&orders.Order{},
		&products.Product{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed successfully")

	router := gin.Default()

	// Serve static upload directory
	router.Static("/uploads", "./uploads")

	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Auction Hub API is running",
		})
	})

	api := router.Group("/api")

	// Authentication routes
	auth.RegisterRoutes(api)

	// User routes
	users.RegisterRoutes(api)

	// Admin routes
	admin.RegisterRoutes(api)

	// Product routes
	products.RegisterRoutes(api)

	// Auction routes
	auctions.RegisterRoutes(api)

	log.Println("Auction Hub server started on http://localhost:8080")

	err = router.Run(":8080")

	if err != nil {
		log.Fatal("Failed to start server:", err)
	}
}