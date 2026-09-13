package sellers

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

func (s *Service) GetSellerProfile(userID uint) (*Seller, error) {

	seller, err := s.Repository.FindSellerByUserID(userID)

	if err != nil {
		return nil, err
	}

	return seller, nil
}

func (s *Service) CreateSeller(
	userID uint,
	request SellerCreateRequest,
) (*Seller, error) {

	// Check if user already has a seller profile
	existingSeller, err := s.Repository.FindSellerByUserID(userID)

	if err == nil && existingSeller != nil {
		return nil, errors.New("seller profile already exists")
	}

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	storeName := strings.TrimSpace(request.StoreName)

	if storeName == "" {
		return nil, errors.New("store name is required")
	}

	seller := &Seller{
		UserID:      userID,
		StoreName:   storeName,
		Description: strings.TrimSpace(request.Description),
		Phone:       strings.TrimSpace(request.Phone),
		Status:      "pending",
	}

	err = s.Repository.CreateSeller(seller)

	if err != nil {
		return nil, err
	}

	return seller, nil
}

func (s *Service) UpdateSeller(
	userID uint,
	request SellerUpdateRequest,
) (*Seller, error) {

	seller, err := s.Repository.FindSellerByUserID(userID)

	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(request.StoreName) != "" {
		seller.StoreName = strings.TrimSpace(request.StoreName)
	}

	seller.Description = strings.TrimSpace(request.Description)
	seller.Phone = strings.TrimSpace(request.Phone)

	err = s.Repository.UpdateSeller(seller)

	if err != nil {
		return nil, err
	}

	return seller, nil
}