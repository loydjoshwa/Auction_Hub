package auctions

import (
	"errors"
	"log"
	"time"

	"auction-hub/database"
	"auction-hub/modules/notifications"

	"gorm.io/gorm"
)

type Repository struct {
	DB                  *gorm.DB
	NotificationService *notifications.Service
}

func NewRepository() *Repository {
	return &Repository{
		DB: database.DB,
	}
}

// CreateAuction creates a new auction.
func (r *Repository) CreateAuction(auction *Auction) error {
	return r.DB.Create(auction).Error
}

// CreateAuctionImage creates an image record for an auction.
func (r *Repository) CreateAuctionImage(auctionImage *AuctionImage) error {
	return r.DB.Create(auctionImage).Error
}

// GetActiveAuctionByProductID checks whether a product
// is currently being used in an active non-expired auction.
func (r *Repository) GetActiveAuctionByProductID(productID uint) (*Auction, error) {
	r.EvaluateExpiredAuctions()

	var auction Auction
	now := time.Now()

	err := r.DB.
		Where("product_id = ? AND status = ? AND end_time > ?", productID, "active", now).
		First(&auction).Error

	if err != nil {
		return nil, err
	}

	return &auction, nil
}

// IsProductInActiveAuction checks if an active non-expired auction exists for productID.
func (r *Repository) IsProductInActiveAuction(productID uint) (bool, error) {
	auction, err := r.GetActiveAuctionByProductID(productID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return auction != nil, nil
}

// EvaluateExpiredAuctions checks for any active auctions that have passed end_time or completed auctions,
// marks them as ended, and creates an Order record for the winning bidder if one does not already exist.
func (r *Repository) EvaluateExpiredAuctions() {
	var targetAuctions []Auction
	now := time.Now()

	err := r.DB.
		Where("(status = ? AND end_time <= ?) OR status = ?", "active", now, "completed").
		Find(&targetAuctions).Error

	if err != nil || len(targetAuctions) == 0 {
		return
	}

	for _, auction := range targetAuctions {

		// Mark expired active auctions as completed.
		if auction.Status == "active" {
			if err := r.DB.Model(&Auction{}).
				Where("id = ? AND status = ?", auction.ID, "active").
				Update("status", "completed").Error; err != nil {
				continue
			}
		}

		// Check whether an order already exists.
		var orderCount int64
		if err := r.DB.Table("orders").
			Where("auction_id = ?", auction.ID).
			Count(&orderCount).Error; err != nil {
			continue
		}

		// Find the highest bidder.
		type HighestBidResult struct {
			UserID uint
			Amount float64
		}

		var topBid HighestBidResult

		bidErr := r.DB.Table("bids").
			Select("user_id, amount").
			Where("auction_id = ?", auction.ID).
			Order("amount DESC, created_at ASC").
			First(&topBid).Error

		if errors.Is(bidErr, gorm.ErrRecordNotFound) {
			// No bids: make the product available for auction again.
			r.DB.Table("products").
				Where("id = ?", auction.ProductID).
				Update("status", "Ready for Auction")

			continue
		}

		if bidErr != nil {
			continue
		}

		if topBid.UserID == 0 {
			continue
		}

		// Create the winner's order only if one does not already exist.
		if orderCount == 0 {
			err := r.DB.Exec(
				`INSERT INTO orders
				(auction_id, buyer_id, seller_id, final_amount, delivery_address, status, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				auction.ID,
				topBid.UserID,
				auction.SellerID,
				topBid.Amount,
				"",
				"Pending Address",
				now,
				now,
			).Error

			if err != nil {
				continue
			}

			r.DB.Table("products").
				Where("id = ?", auction.ProductID).
				Update("status", "Completed")
		}

		// Create auction-result notifications.
		if r.NotificationService == nil {
			continue
		}

		// Notify the winner if this notification does not already exist.
		var winnerNotificationCount int64

		r.DB.Model(&notifications.Notification{}).
			Where(
				"user_id = ? AND type = ? AND title = ? AND message = ?",
				topBid.UserID,
				"auction_won",
				"Auction Won",
				"You won the auction: "+auction.Title,
			).
			Count(&winnerNotificationCount)

		if winnerNotificationCount == 0 {
			if err := r.NotificationService.CreateNotification(
				topBid.UserID,
				"auction_won",
				"Auction Won",
				"You won the auction: "+auction.Title,
			); err != nil {
				log.Printf("Failed to notify auction winner for auction %d: %v", auction.ID, err)
			}
		}

		// Notify the seller if this notification does not already exist.
		var sellerNotificationCount int64

		r.DB.Model(&notifications.Notification{}).
			Where(
				"user_id = ? AND type = ? AND title = ? AND message = ?",
				auction.SellerID,
				"auction_ended",
				"Auction Ended",
				"Your auction has ended: "+auction.Title,
			).
			Count(&sellerNotificationCount)

		if sellerNotificationCount == 0 {
			if err := r.NotificationService.CreateNotification(
				auction.SellerID,
				"auction_ended",
				"Auction Ended",
				"Your auction has ended: "+auction.Title,
			); err != nil {
				log.Printf("Failed to notify auction seller for auction %d: %v", auction.ID, err)
			}
		}
	}
}

// GetActiveAuctions returns all active auctions.
// Product and Seller information are loaded for displaying
// auction cards to all users.
func (r *Repository) GetActiveAuctions() ([]Auction, error) {
	r.EvaluateExpiredAuctions()

	var auctions []Auction
	now := time.Now()

	err := r.DB.
		Preload("Product").
		Preload("Seller").
		Where("(status = ? OR status = ?) AND end_time > ?", "active", "paused", now).
		Order("created_at DESC").
		Find(&auctions).Error

	if err != nil {
		return nil, err
	}

	for i := range auctions {
		var count int64
		r.DB.Table("bids").Where("auction_id = ?", auctions[i].ID).Count(&count)
		auctions[i].BidCount = count
	}

	return auctions, nil
}

// GetAuctionByID returns a single auction with its product
// and seller information.
func (r *Repository) GetAuctionByID(auctionID uint) (*Auction, error) {
	r.EvaluateExpiredAuctions()

	var auction Auction

	err := r.DB.
		Preload("Product").
		Preload("Seller").
		First(&auction, auctionID).Error

	if err != nil {
		return nil, err
	}

	if auction.Status == "active" && (time.Now().After(auction.EndTime) || time.Now().Equal(auction.EndTime)) {
		r.EvaluateExpiredAuctions()
		_ = r.DB.Preload("Product").Preload("Seller").First(&auction, auctionID).Error
	}

	if auction.Status == "paused" {
		type LogReason struct {
			Reason string
		}
		var logRes LogReason
		errLog := r.DB.Table("admin_action_logs").
			Select("reason").
			Where("action_type = ? AND entity_id = ?", "PAUSE_AUCTION", auction.ID).
			Order("created_at DESC").
			First(&logRes).Error
		if errLog == nil && logRes.Reason != "" {
			auction.PauseReason = logRes.Reason
		}
	}

	var count int64
	r.DB.Table("bids").Where("auction_id = ?", auction.ID).Count(&count)
	auction.BidCount = count

	return &auction, nil
}

// UpdateAuction updates an existing auction record.
func (r *Repository) UpdateAuction(auction *Auction) error {
	return r.DB.Save(auction).Error
}

// GetAuctionsBySellerID returns all auctions created by the specified seller.
func (r *Repository) GetAuctionsBySellerID(sellerID uint) ([]Auction, error) {
	r.EvaluateExpiredAuctions()

	var auctions []Auction
	err := r.DB.
		Preload("Product").
		Where("seller_id = ?", sellerID).
		Order("created_at DESC").
		Find(&auctions).Error

	if err != nil {
		return nil, err
	}

	for i := range auctions {
		var count int64
		r.DB.Table("bids").Where("auction_id = ?", auctions[i].ID).Count(&count)
		auctions[i].BidCount = count
		if (auctions[i].Status == "active" || auctions[i].Status == "Active") && time.Now().Before(auctions[i].EndTime) {
			auctions[i].Status = "Active"
		} else {
			auctions[i].Status = "Completed"
		}
	}

	return auctions, nil
}

// GetWonAuctionsByBuyerID returns all ended auctions won by the specified buyer.
func (r *Repository) GetWonAuctionsByBuyerID(buyerID uint) ([]Auction, error) {
	r.EvaluateExpiredAuctions()

	var auctionIDs []uint
	err := r.DB.Table("orders").
		Where("buyer_id = ? AND seller_id != ?", buyerID, buyerID).
		Pluck("auction_id", &auctionIDs).Error

	if err != nil || len(auctionIDs) == 0 {
		return []Auction{}, nil
	}

	var auctions []Auction
	err = r.DB.
		Preload("Product").
		Preload("Seller").
		Where("id IN ?", auctionIDs).
		Order("created_at DESC").
		Find(&auctions).Error

	if err != nil {
		return nil, err
	}

	return auctions, nil
}