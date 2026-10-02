package bids

import (
	"time"

	"auction-hub/database"
	"auction-hub/modules/products"

	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

func NewRepository() *Repository {
	return &Repository{
		DB: database.DB,
	}
}

// CreateBid saves a new bid in the database.
func (r *Repository) CreateBid(bid *Bid) error {
	return r.DB.Create(bid).Error
}

// GetBidsByAuctionID returns all bids for an auction,
// with the highest bid first.
func (r *Repository) GetBidsByAuctionID(auctionID uint) ([]Bid, error) {
	var bids []Bid

	err := r.DB.
		Preload("User").
		Where("auction_id = ?", auctionID).
		Order("amount DESC").
		Find(&bids).Error

	if err != nil {
		return nil, err
	}

	return bids, nil
}

// GetHighestBidByAuctionID returns the highest bid
// placed for a particular auction.
func (r *Repository) GetHighestBidByAuctionID(auctionID uint) (*Bid, error) {
	var bid Bid

	err := r.DB.
		Where("auction_id = ?", auctionID).
		Order("amount DESC").
		First(&bid).Error

	if err != nil {
		return nil, err
	}

	return &bid, nil
}

// GetMyBids returns all auctions in which the logged-in user placed a bid.
func (r *Repository) GetMyBids(userID uint) ([]MyBidItem, error) {
	var auctionIDs []uint
	err := r.DB.Table("bids").
		Where("user_id = ?", userID).
		Distinct("auction_id").
		Pluck("auction_id", &auctionIDs).Error

	if err != nil {
		return nil, err
	}

	if len(auctionIDs) == 0 {
		return []MyBidItem{}, nil
	}

	items := make([]MyBidItem, 0, len(auctionIDs))

	for _, aid := range auctionIDs {
		var auction struct {
			ID           uint
			Title        string
			Status       string
			CurrentPrice float64
			EndTime      time.Time
			ProductID    uint
		}
		err := r.DB.Table("auctions").
			Select("id, title, status, current_price, end_time, product_id").
			Where("id = ?", aid).
			First(&auction).Error
		if err != nil {
			continue
		}

		var prod products.Product
		r.DB.Table("products").Where("id = ?", auction.ProductID).First(&prod)

		// User's highest bid
		var myMaxBid float64
		r.DB.Table("bids").
			Where("auction_id = ? AND user_id = ?", aid, userID).
			Select("COALESCE(MAX(amount), 0)").
			Scan(&myMaxBid)

		// Overall highest bid & bidder
		type TopBidder struct {
			UserID uint
			Amount float64
		}
		var topBid TopBidder
		r.DB.Table("bids").
			Select("user_id, amount").
			Where("auction_id = ?", aid).
			Order("amount DESC, created_at ASC").
			First(&topBid)

		userStatus := "outbid"
		statusMsg := "Outbid"

		isEnded := auction.Status == "ended" || auction.Status == "completed" || auction.Status == "Completed" || time.Now().After(auction.EndTime) || time.Now().Equal(auction.EndTime)
		isHighest := topBid.UserID == userID

		if !isEnded {
			if isHighest {
				userStatus = "highest"
				statusMsg = "You're currently the highest bidder"
			} else {
				userStatus = "outbid"
				statusMsg = "Outbid"
			}
		} else {
			if isHighest {
				userStatus = "won"
				statusMsg = "You Won"
			} else {
				userStatus = "lost"
				statusMsg = "You Lost"
			}
		}

		items = append(items, MyBidItem{
			AuctionID:     auction.ID,
			AuctionStatus: auction.Status,
			Title:         auction.Title,
			CurrentPrice:  auction.CurrentPrice,
			MyHighestBid:  myMaxBid,
			EndTime:       auction.EndTime,
			UserStatus:    userStatus,
			StatusMessage: statusMsg,
			Product:       &prod,
		})
	}

	return items, nil
}
