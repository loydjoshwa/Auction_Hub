package sellers

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

func (r *Repository) FindSellerByUserID(userID uint) (*Seller, error) {

	var seller Seller

	err := r.DB.
		Where("user_id = ?", userID).
		First(&seller).Error

	if err != nil {
		return nil, err
	}

	return &seller, nil
}

func (r *Repository) CreateSeller(seller *Seller) error {

	return r.DB.Create(seller).Error
}

func (r *Repository) UpdateSeller(seller *Seller) error {

	return r.DB.Save(seller).Error
}