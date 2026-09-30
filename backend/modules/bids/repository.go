package bids

import (
	"auction-hub/database"

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