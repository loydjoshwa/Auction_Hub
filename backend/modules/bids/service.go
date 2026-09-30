package bids

import (
	"errors"
	"strings"
	"time"

	"auction-hub/modules/auctions"

	"gorm.io/gorm"
)

var (
	ErrAuctionNotFound   = errors.New("auction not found")
	ErrAuctionNotActive  = errors.New("auction is not active")
	ErrAuctionEnded      = errors.New("auction has ended")
	ErrSellerCannotBid   = errors.New("seller cannot bid on own auction")
	ErrBidAmountTooLow   = errors.New("bid amount must be greater than current price")
	ErrInvalidBidAmount  = errors.New("bid amount must be greater than 0")
)

type Service struct {
	Repository        *Repository
	AuctionRepository *auctions.Repository
}

func NewService(repository *Repository, auctionRepository *auctions.Repository) *Service {
	return &Service{
		Repository:        repository,
		AuctionRepository: auctionRepository,
	}
}

// CreateBid validates and places a bid on an active auction.
func (s *Service) CreateBid(userID uint, auctionID uint, amount float64) (*Bid, *auctions.Auction, error) {

	// 1. Validate bid amount.
	if amount <= 0 {
		return nil, nil, ErrInvalidBidAmount
	}

	// 2. Fetch auction and check existence.
	auction, err := s.AuctionRepository.GetAuctionByID(auctionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrAuctionNotFound
		}
		return nil, nil, err
	}

	// 3. Check if auction status is active.
	if strings.ToLower(auction.Status) != "active" {
		return nil, nil, ErrAuctionNotActive
	}

	// 4. Check if auction has ended.
	if time.Now().After(auction.EndTime) {
		return nil, nil, ErrAuctionEnded
	}

	// 5. Prevent seller from bidding on their own auction.
	if auction.SellerID == userID {
		return nil, nil, ErrSellerCannotBid
	}

	// 6. Validate bid amount against highest bid and starting/current price.
	highestBid, err := s.Repository.GetHighestBidByAuctionID(auctionID)

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}

	if highestBid != nil {
		// Previous bids exist: bid must be strictly greater than current highest bid/current price
		if amount <= highestBid.Amount || amount <= auction.CurrentPrice {
			return nil, nil, ErrBidAmountTooLow
		}
	} else {
		// No previous bids: bid must be greater than or equal to starting price/current price
		if amount < auction.StartingPrice || amount < auction.CurrentPrice {
			return nil, nil, errors.New("bid amount must be greater than or equal to starting price")
		}
	}

	// 7. Save the bid.
	bid := &Bid{
		AuctionID: auctionID,
		UserID:    userID,
		Amount:    amount,
	}

	err = s.Repository.CreateBid(bid)
	if err != nil {
		return nil, nil, err
	}

	// 8. Update auction current price.
	auction.CurrentPrice = amount
	err = s.AuctionRepository.UpdateAuction(auction)
	if err != nil {
		return nil, nil, err
	}

	return bid, auction, nil
}

// GetBidsByAuctionID fetches all bids for a specific auction.
func (s *Service) GetBidsByAuctionID(auctionID uint) ([]Bid, error) {

	// Ensure auction exists
	_, err := s.AuctionRepository.GetAuctionByID(auctionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAuctionNotFound
		}
		return nil, err
	}

	return s.Repository.GetBidsByAuctionID(auctionID)
}