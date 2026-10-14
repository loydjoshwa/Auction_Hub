package bids

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"auction-hub/modules/auctions"
	"auction-hub/modules/notifications"

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
	Repository          *Repository
	AuctionRepository   *auctions.Repository
	NotificationService *notifications.Service
}

func NewService(
	repository *Repository,
	auctionRepository *auctions.Repository,
) *Service {
	return &Service{
		Repository:        repository,
		AuctionRepository: auctionRepository,
	}
}

// CreateBid validates and places a bid on an active auction.
// After a successful bid, it creates notifications for the seller
// and the previous highest bidder.
func (s *Service) CreateBid(
	userID uint,
	auctionID uint,
	amount float64,
) (*Bid, *auctions.Auction, error) {

	// Validate bid amount.
	if amount <= 0 {
		return nil, nil, ErrInvalidBidAmount
	}

	s.AuctionRepository.EvaluateExpiredAuctions()

	var newBid *Bid
	var updatedAuction *auctions.Auction

	var previousHighestBidderID uint
	var previousHighestAmount float64

	// Place the bid and update the auction in one transaction.
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

		// Find the previous highest bidder before inserting the new bid.
		var previousBid Bid

		err := tx.
			Where("auction_id = ?", auctionID).
			Order("amount DESC, created_at ASC").
			First(&previousBid).Error

		if err == nil {
			previousHighestBidderID = previousBid.UserID
			previousHighestAmount = previousBid.Amount
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// Verify the new amount exceeds the highest existing bid.
		var highestExisting float64

		if err := tx.Table("bids").
			Where("auction_id = ?", auctionID).
			Select("COALESCE(MAX(amount), 0)").
			Scan(&highestExisting).Error; err != nil {
			return err
		}

		if amount <= highestExisting {
			return ErrBidAmountTooLow
		}

		// Create the new bid.
		newBid = &Bid{
			AuctionID: auctionID,
			UserID:    userID,
			Amount:    amount,
		}

		if err := tx.Create(newBid).Error; err != nil {
			return err
		}

		// Update the auction's current price.
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

	// The bid is committed successfully at this point.
	// Notification failures must not turn the successful bid into an error.

	if s.NotificationService != nil {

		// Notify the seller about the new bid.
		if err := s.NotificationService.CreateNotification(
			updatedAuction.SellerID,
			"new_bid",
			"New Bid Received",
			"A new bid has been placed on your auction: "+updatedAuction.Title,
		); err != nil {
			log.Printf(
				"Failed to create new-bid notification for seller %d: %v",
				updatedAuction.SellerID,
				err,
			)
		}

		// Notify the previous highest bidder if another user outbid them.
		if previousHighestBidderID != 0 &&
			previousHighestBidderID != userID {

			if err := s.NotificationService.CreateNotification(
				previousHighestBidderID,
				"outbid",
				"You Have Been Outbid",
				"Someone placed a higher bid on "+updatedAuction.Title+
					". Your previous bid was "+formatBidAmount(previousHighestAmount)+
					". The current bid is "+formatBidAmount(amount)+".",
			); err != nil {
				log.Printf(
					"Failed to create outbid notification for user %d: %v",
					previousHighestBidderID,
					err,
				)
			}
		}
	}

	return newBid, updatedAuction, nil
}

// formatBidAmount formats a bid amount for notification messages.
func formatBidAmount(amount float64) string {
	return time.Now().Format("") + strings.TrimRight(
		strings.TrimRight(
			fmt.Sprintf("%.2f", amount),
			"0",
		),
		".",
	)
}

// GetBidsByAuctionID fetches all bids for a specific auction.
func (s *Service) GetBidsByAuctionID(
	auctionID uint,
) ([]Bid, error) {

	_, err := s.AuctionRepository.GetAuctionByID(auctionID)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAuctionNotFound
		}

		return nil, err
	}

	return s.Repository.GetBidsByAuctionID(auctionID)
}

// GetMyBids fetches all auctions where the user has placed a bid.
func (s *Service) GetMyBids(userID uint) ([]MyBidItem, error) {
	s.AuctionRepository.EvaluateExpiredAuctions()
	return s.Repository.GetMyBids(userID)
}