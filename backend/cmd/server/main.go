package main

import (
	"log"

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"auction-hub/database"
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
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	database.ConnectDB()

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
		&users.Watchlist{},
		&sellers.SellerVerification{},
		&orders.Order{},
		&reports.Report{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed successfully")
	log.Println("Auction Hub server started")
} 