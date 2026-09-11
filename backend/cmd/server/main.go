package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"auction-hub/database"
	"auction-hub/modules/auth"
	"auction-hub/modules/auctions"
	"auction-hub/modules/bids"
	"auction-hub/modules/categories"
	"auction-hub/modules/chat"
	"auction-hub/modules/notifications"
	"auction-hub/modules/orders"
	"auction-hub/modules/reports"
	"auction-hub/modules/sellers"
	"auction-hub/modules/users"
)

func main() {

	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to PostgreSQL
	database.ConnectDB()

	// Connect to Redis
	database.ConnectRedis()

	var db *gorm.DB = database.DB

	// Database migration
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
		&sellers.SellerVerification{},
		&orders.Order{},
		&reports.Report{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed successfully")

	// Create Gin router
	router := gin.Default()

	// Enable CORS for React frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check API
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Auction Hub API is running",
		})
	})

	// API routes
	api := router.Group("/api")

	auth.RegisterRoutes(api)

	// Start server
	log.Println("Auction Hub server started on http://localhost:8080")

	err = router.Run(":8080")
	if err != nil {
		log.Fatal("Failed to start server:", err)
	}
}