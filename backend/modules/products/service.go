package products

import (
	"errors"
	"strings"
)

var (
	ErrProductNotFound              = errors.New("product not found")
	ErrUnauthorizedAccess           = errors.New("unauthorized: product does not belong to user")
	ErrInvalidInput                 = errors.New("invalid input: product name and description are required")
	ErrProductInActiveAuction       = errors.New("Product cannot be modified while it is in an active auction.")
	ErrProductInActiveAuctionDelete = errors.New("Product cannot be deleted while it is in an active auction.")
	ErrProductHasHistory            = errors.New("Product cannot be deleted because it has historical auction records.")
)

type AuctionChecker interface {
	EvaluateExpiredAuctions()
	IsProductInActiveAuction(productID uint) (bool, error)
}

type Service struct {
	Repository     *Repository
	AuctionChecker AuctionChecker
}

func NewService(repository *Repository, auctionChecker AuctionChecker) *Service {
	return &Service{
		Repository:     repository,
		AuctionChecker: auctionChecker,
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
		Status:      "Ready for Auction",
	}

	err := s.Repository.CreateProduct(product)
	if err != nil {
		return nil, err
	}

	return product, nil
}

func (s *Service) GetMyProducts(userID uint) ([]Product, error) {
	if s.AuctionChecker != nil {
		s.AuctionChecker.EvaluateExpiredAuctions()
	}

	productList, err := s.Repository.GetProductsByUserID(userID)
	if err != nil {
		return nil, err
	}

	for i := range productList {
		if s.AuctionChecker != nil {
			active, _ := s.AuctionChecker.IsProductInActiveAuction(productList[i].ID)
			if !active {
				if productList[i].Status == "In Auction" {
					productList[i].Status = "Ready for Auction"
					_ = s.Repository.UpdateProduct(&productList[i])
				}
			} else {
				if productList[i].Status != "In Auction" {
					productList[i].Status = "In Auction"
					_ = s.Repository.UpdateProduct(&productList[i])
				}
			}
		}
	}

	return productList, nil
}

func (s *Service) GetProductByID(id uint, userID uint) (*Product, error) {
	product, err := s.Repository.GetProductByID(id)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if product.UserID != userID {
		return nil, ErrUnauthorizedAccess
	}

	if s.AuctionChecker != nil {
		s.AuctionChecker.EvaluateExpiredAuctions()
		active, _ := s.AuctionChecker.IsProductInActiveAuction(id)
		if !active {
			if product.Status == "In Auction" {
				product.Status = "Ready for Auction"
				_ = s.Repository.UpdateProduct(product)
			}
		}
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

	if s.AuctionChecker != nil {
		s.AuctionChecker.EvaluateExpiredAuctions()
		active, _ := s.AuctionChecker.IsProductInActiveAuction(id)
		if active {
			return nil, ErrProductInActiveAuction
		}
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

	if s.AuctionChecker != nil {
		s.AuctionChecker.EvaluateExpiredAuctions()
		active, _ := s.AuctionChecker.IsProductInActiveAuction(id)
		if active {
			return nil, ErrProductInActiveAuctionDelete
		}
	}

	var auctionCount int64
	s.Repository.DB.Table("auctions").Where("product_id = ?", id).Count(&auctionCount)
	if auctionCount > 0 {
		return nil, ErrProductHasHistory
	}

	err = s.Repository.DeleteProduct(id)
	if err != nil {
		return nil, err
	}

	return product, nil
}
