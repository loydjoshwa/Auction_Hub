package auctions

import (
	"errors"
	"strings"
	"time"

	"auction-hub/modules/products"
)

var (
	ErrInvalidPrice         = errors.New("Starting price must be greater than 0")
	ErrInvalidDuration      = errors.New("Invalid auction duration selected")
	ErrProductNotFound      = errors.New("Product not found")
	ErrUnauthorizedProduct  = errors.New("Forbidden: You do not own this product")
	ErrAlreadyInAuction     = errors.New("Product is already in an active auction")
)

type Service struct {
	Repository        *Repository
	ProductRepository *products.Repository
}

func NewService(repository *Repository, productRepository *products.Repository) *Service {
	return &Service{
		Repository:        repository,
		ProductRepository: productRepository,
	}
}

func ParseAuctionDuration(dStr string) (time.Duration, error) {
	cleaned := strings.ToLower(strings.TrimSpace(dStr))
	switch cleaned {
	case "1h", "1 hour", "1 hours":
		return 1 * time.Hour, nil
	case "6h", "6 hours":
		return 6 * time.Hour, nil
	case "12h", "12 hours":
		return 12 * time.Hour, nil
	case "1d", "1 day", "24h":
		return 24 * time.Hour, nil
	case "3d", "3 days", "72h":
		return 3 * 24 * time.Hour, nil
	case "7d", "7 days", "168h":
		return 7 * 24 * time.Hour, nil
	default:
		return 0, ErrInvalidDuration
	}
}

func (s *Service) CreateAuction(userID uint, productID uint, startingPrice float64, durationStr string) (*Auction, error) {
	if startingPrice <= 0 {
		return nil, ErrInvalidPrice
	}

	duration, err := ParseAuctionDuration(durationStr)
	if err != nil {
		return nil, err
	}

	product, err := s.ProductRepository.GetProductByID(productID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if product.UserID != userID {
		return nil, ErrUnauthorizedProduct
	}

	if product.Status == "In Auction" {
		return nil, ErrAlreadyInAuction
	}

	// Also double-check if an active auction exists for this product ID in auctions table
	activeAuction, _ := s.Repository.GetActiveAuctionByProductID(productID)
	if activeAuction != nil {
		return nil, ErrAlreadyInAuction
	}

	now := time.Now()
	auction := &Auction{
		SellerID:      userID,
		ProductID:     product.ID,
		CategoryID:    1, // Default category
		Title:         product.Name,
		Description:   product.Description,
		StartingPrice: startingPrice,
		CurrentPrice:  startingPrice,
		StartTime:     now,
		EndTime:       now.Add(duration),
		Status:        "active",
	}

	err = s.Repository.CreateAuction(auction)
	if err != nil {
		return nil, err
	}

	// Create primary auction image if product has image URL
	if product.ImageURL != "" {
		_ = s.Repository.CreateAuctionImage(&AuctionImage{
			AuctionID: auction.ID,
			ImageURL:  product.ImageURL,
			IsPrimary: true,
		})
	}

	// Update Product status
	product.Status = "In Auction"
	_ = s.ProductRepository.UpdateProduct(product)

	return auction, nil
}

func (s *Service) GetActiveAuctions() ([]Auction, error) {
	return s.Repository.GetActiveAuctions()
}