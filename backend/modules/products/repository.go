package products

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

func (r *Repository) CreateProduct(product *Product) error {
	return r.DB.Create(product).Error
}

func (r *Repository) GetProductsByUserID(userID uint) ([]Product, error) {
	var products []Product
	err := r.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&products).Error
	if err != nil {
		return nil, err
	}
	return products, nil
}

func (r *Repository) GetProductByID(id uint) (*Product, error) {
	var product Product
	err := r.DB.First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *Repository) UpdateProduct(product *Product) error {
	return r.DB.Save(product).Error
}

func (r *Repository) DeleteProduct(id uint) error {
	return r.DB.Delete(&Product{}, id).Error
}
