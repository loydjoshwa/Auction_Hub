package bids

import (
	"errors"
	"strings"
	"time"

	"auction-hub/modules/auctions"

	"gorm.io/gorm"
)

var (
	ErrAuctionNotFound  = errors.New("auction not found")
	ErrAuctionNotActive = errors.New("auction is not active")
	ErrAuctionPaused    = errors.New("this auction is currently paused by administrator. New bids are not allowed")
	ErrAuctionEnded     = errors.New("auction has ended")
	ErrSellerCannotBid  = errors.New("seller cannot bid on own auction")
	ErrBidAmountTooLow  = errors.New("bid amount must be greater than current price")
	ErrInvalidBidAmount = errors.New("bid amount must be greater than 0")
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

// CreateBid validates and places a bid on an active auction with database transaction & concurrency protection.
func (s *Service) CreateBid(userID uint, auctionID uint, amount float64) (*Bid, *auctions.Auction, error) {

	// 1. Validate bid amount.
	if amount <= 0 {
		return nil, nil, ErrInvalidBidAmount
	}

	s.AuctionRepository.EvaluateExpiredAuctions()

	var newBid *Bid
	var updatedAuction *auctions.Auction

	// 2. Transaction for atomic bid insertion and auction price update
	err := s.Repository.DB.Transaction(func(tx *gorm.DB) error {
		var auction auctions.Auction
		if err := tx.First(&auction, auctionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrAuctionNotFound
			}
			return err
		}

		if strings.ToLower(auction.Status) == "paused" {
			return ErrAuctionPaused
		}

		if strings.ToLower(auction.Status) != "active" {
			return ErrAuctionNotActive
		}

		now := time.Now()
		if now.After(auction.EndTime) || now.Equal(auction.EndTime) {
			return ErrAuctionEnded
		}

		if auction.SellerID == userID {
			return ErrSellerCannotBid
		}

		if amount <= auction.CurrentPrice {
			return ErrBidAmountTooLow
		}

		var highestExisting float64
		tx.Table("bids").
			Where("auction_id = ?", auctionID).
			Select("COALESCE(MAX(amount), 0)").
			Scan(&highestExisting)

		if amount <= highestExisting {
			return ErrBidAmountTooLow
		}

		newBid = &Bid{
			AuctionID: auctionID,
			UserID:    userID,
			Amount:    amount,
		}

		if err := tx.Create(newBid).Error; err != nil {
			return err
		}

		auction.CurrentPrice = amount
		if err := tx.Save(&auction).Error; err != nil {
			return err
		}

		updatedAuction = &auction
		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return newBid, updatedAuction, nil
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

// GetMyBids fetches all auctions where the user has placed bids with calculated status.
func (s *Service) GetMyBids(userID uint) ([]MyBidItem, error) {
	s.AuctionRepository.EvaluateExpiredAuctions()
	return s.Repository.GetMyBids(userID)
}
