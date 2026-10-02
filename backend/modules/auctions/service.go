package auctions

import (
	"errors"
	"strings"
	"time"

	"auction-hub/modules/products"

	"gorm.io/gorm"
)

var (
	ErrInvalidPrice        = errors.New("starting price must be greater than 0")
	ErrInvalidDuration     = errors.New("invalid auction duration selected")
	ErrProductNotFound     = errors.New("product not found")
	ErrAuctionNotFound     = errors.New("auction not found")
	ErrUnauthorizedProduct = errors.New("forbidden: you do not own this product")
	ErrUnauthorizedAuction = errors.New("forbidden: you do not own this auction")
	ErrAlreadyInAuction    = errors.New("product is already in an active auction")
	ErrAuctionAlreadyEnded = errors.New("Auction is already ended.")
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

// ParseAuctionDuration converts the duration selected by the user
// into a Go time.Duration.
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

// CreateAuction creates an auction for a product owned by the logged-in user.
func (s *Service) CreateAuction(
	userID uint,
	productID uint,
	startingPrice float64,
	durationStr string,
) (*Auction, error) {

	// 1. Validate starting price.
	if startingPrice <= 0 {
		return nil, ErrInvalidPrice
	}

	// 2. Validate auction duration.
	duration, err := ParseAuctionDuration(durationStr)
	if err != nil {
		return nil, err
	}

	// 3. Get the product.
	product, err := s.ProductRepository.GetProductByID(productID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	// 4. Make sure the logged-in user owns the product.
	if product.UserID != userID {
		return nil, ErrUnauthorizedProduct
	}

	// 5. Make sure the product is not already in an auction.
	if product.Status == "In Auction" {
		return nil, ErrAlreadyInAuction
	}

	// 6. Double-check the auctions table.
	activeAuction, err := s.Repository.GetActiveAuctionByProductID(productID)

	if err == nil && activeAuction != nil {
		return nil, ErrAlreadyInAuction
	}

	// "Record not found" is expected because the product
	// does not currently have an active auction.
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 7. Create auction using DB transaction for atomicity.
	now := time.Now()

	auction := &Auction{
		SellerID:      userID,
		ProductID:     product.ID,
		CategoryID:    1,
		Title:         product.Name,
		Description:   product.Description,
		StartingPrice: startingPrice,
		CurrentPrice:  startingPrice,
		StartTime:     now,
		EndTime:       now.Add(duration),
		Status:        "active",
	}

	err = s.Repository.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(auction).Error; err != nil {
			return err
		}

		if product.ImageURL != "" {
			img := &AuctionImage{
				AuctionID: auction.ID,
				ImageURL:  product.ImageURL,
				IsPrimary: true,
			}
			if err := tx.Create(img).Error; err != nil {
				return err
			}
		}

		if err := tx.Model(&products.Product{}).Where("id = ?", product.ID).Update("status", "In Auction").Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return auction, nil
}

// GetActiveAuctions returns all currently active auctions.
func (s *Service) GetActiveAuctions() ([]Auction, error) {
	return s.Repository.GetActiveAuctions()
}

// GetAuctionByID returns one auction with its product and seller information.
func (s *Service) GetAuctionByID(auctionID uint) (*Auction, error) {
	return s.Repository.GetAuctionByID(auctionID)
}

// EndAuction allows the seller owning the auction to end it manually before EndTime.
func (s *Service) EndAuction(auctionID uint, userID uint) (*Auction, error) {
	auction, err := s.Repository.GetAuctionByID(auctionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAuctionNotFound
		}
		return nil, err
	}

	if auction.SellerID != userID {
		return nil, ErrUnauthorizedAuction
	}

	if strings.ToLower(auction.Status) != "active" || time.Now().After(auction.EndTime) || time.Now().Equal(auction.EndTime) {
		return nil, ErrAuctionAlreadyEnded
	}

	auction.Status = "completed"
	auction.EndTime = time.Now()

	err = s.Repository.UpdateAuction(auction)
	if err != nil {
		return nil, err
	}

	s.Repository.EvaluateExpiredAuctions()

	updatedAuction, err := s.Repository.GetAuctionByID(auctionID)
	if err == nil && updatedAuction != nil {
		return updatedAuction, nil
	}

	return auction, nil
}

// GetMyAuctions returns all auctions created by the specified seller.
func (s *Service) GetMyAuctions(sellerID uint) ([]Auction, error) {
	return s.Repository.GetAuctionsBySellerID(sellerID)
}

// GetWonAuctions returns all ended auctions won by the specified buyer.
func (s *Service) GetWonAuctions(buyerID uint) ([]Auction, error) {
	return s.Repository.GetWonAuctionsByBuyerID(buyerID)
}
