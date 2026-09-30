package auctions

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

// CreateAuction creates a new auction.
func (r *Repository) CreateAuction(auction *Auction) error {
	return r.DB.Create(auction).Error
}

// CreateAuctionImage creates an image record for an auction.
func (r *Repository) CreateAuctionImage(auctionImage *AuctionImage) error {
	return r.DB.Create(auctionImage).Error
}

// GetActiveAuctionByProductID checks whether a product
// is already being used in an active auction.
func (r *Repository) GetActiveAuctionByProductID(productID uint) (*Auction, error) {
	var auction Auction

	err := r.DB.
		Where("product_id = ? AND status = ?", productID, "active").
		First(&auction).Error

	if err != nil {
		return nil, err
	}

	return &auction, nil
}

// GetActiveAuctions returns all active auctions.
// Product and Seller information are loaded for displaying
// auction cards to all users.
func (r *Repository) GetActiveAuctions() ([]Auction, error) {
	var auctions []Auction

	err := r.DB.
		Preload("Product").
		Preload("Seller").
		Where("status = ?", "active").
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
	var auction Auction

	err := r.DB.
		Preload("Product").
		Preload("Seller").
		First(&auction, auctionID).Error

	if err != nil {
		return nil, err
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