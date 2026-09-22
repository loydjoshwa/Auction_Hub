package products

import (
	"errors"
	"strings"
)

var (
	ErrProductNotFound     = errors.New("product not found")
	ErrUnauthorizedAccess  = errors.New("unauthorized: product does not belong to user")
	ErrInvalidInput        = errors.New("invalid input: product name and description are required")
)

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

func (s *Service) CreateProduct(userID uint, name, description, imageURL string) (*Product, error) {
	trimmedName := strings.TrimSpace(name)
	trimmedDesc := strings.TrimSpace(description)

	if trimmedName == "" || trimmedDesc == "" {
		return nil, ErrInvalidInput
	}

	product := &Product{
		UserID:      userID,
		Name:        trimmedName,
		Description: trimmedDesc,
		ImageURL:    imageURL,
	}

	err := s.Repository.CreateProduct(product)
	if err != nil {
		return nil, err
	}

	return product, nil
}

func (s *Service) GetMyProducts(userID uint) ([]Product, error) {
	return s.Repository.GetProductsByUserID(userID)
}

func (s *Service) GetProductByID(id uint, userID uint) (*Product, error) {
	product, err := s.Repository.GetProductByID(id)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if product.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	return product, nil
}

func (s *Service) UpdateProduct(id uint, userID uint, name, description, newImageURL string) (*Product, error) {
	product, err := s.Repository.GetProductByID(id)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if product.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	trimmedName := strings.TrimSpace(name)
	trimmedDesc := strings.TrimSpace(description)

	if trimmedName == "" || trimmedDesc == "" {
		return nil, ErrInvalidInput
	}

	product.Name = trimmedName
	product.Description = trimmedDesc
	if newImageURL != "" {
		product.ImageURL = newImageURL
	}

	err = s.Repository.UpdateProduct(product)
	if err != nil {
		return nil, err
	}

	return product, nil
}

func (s *Service) DeleteProduct(id uint, userID uint) (*Product, error) {
	product, err := s.Repository.GetProductByID(id)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if product.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	err = s.Repository.DeleteProduct(id)
	if err != nil {
		return nil, err
	}

	return product, nil
}
