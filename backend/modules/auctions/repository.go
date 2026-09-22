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

func (r *Repository) CreateAuction(auction *Auction) error {
	return r.DB.Create(auction).Error
}

func (r *Repository) GetActiveAuctionByProductID(productID uint) (*Auction, error) {
	var auction Auction
	err := r.DB.Where("product_id = ? AND status = ?", productID, "active").First(&auction).Error
	if err != nil {
		return nil, err
	}
	return &auction, nil
}