package admin

import (
	"errors"

	"auction-hub/modules/auctions"
	"auction-hub/modules/orders"
	"auction-hub/modules/products"
	"auction-hub/modules/users"
)

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

// GetAllUsers gets all users for the admin with optional search and status parameters.
func (s *Service) GetAllUsers(search string, status string) ([]users.User, error) {
	return s.Repository.GetAllUsers(search, status)
}

// GetDashboardAnalytics calculates counts for total, active, and blocked users.
func (s *Service) GetDashboardAnalytics() (*DashboardAnalytics, error) {
	return s.Repository.GetDashboardAnalytics()
}

// BlockUser blocks a user account, preventing admin self-blocking.
func (s *Service) BlockUser(adminUserID uint, targetUserID uint) (*users.User, error) {
	if adminUserID == targetUserID {
		return nil, errors.New("You cannot block your own account.")
	}
	return s.Repository.SetUserBlockedStatus(targetUserID, true)
}

// UnblockUser unblocks a user account.
func (s *Service) UnblockUser(targetUserID uint) (*users.User, error) {
	return s.Repository.SetUserBlockedStatus(targetUserID, false)
}

// Manage Products Service
func (s *Service) GetAllProducts(search string, statusFilter string, inAuctionFilter string, sort string) ([]products.Product, error) {
	return s.Repository.GetAllProducts(search, statusFilter, inAuctionFilter, sort)
}

func (s *Service) DeleteProduct(adminUserID uint, productID uint, reason string) error {
	return s.Repository.DeleteProduct(adminUserID, productID, reason)
}

// Manage Auctions Service
func (s *Service) GetAllAuctions(search string, statusFilter string, sort string) ([]AdminAuctionItem, error) {
	return s.Repository.GetAllAuctions(search, statusFilter, sort)
}

func (s *Service) CancelAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	return s.Repository.CancelAuction(adminUserID, auctionID, reason)
}

func (s *Service) PauseAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	return s.Repository.PauseAuction(adminUserID, auctionID, reason)
}

func (s *Service) ResumeAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	return s.Repository.ResumeAuction(adminUserID, auctionID, reason)
}

// Manage Bids Service
func (s *Service) GetAllBids(search string, auctionIDStr string, bidderIDStr string, sort string) ([]AdminBidItem, error) {
	return s.Repository.GetAllBids(search, auctionIDStr, bidderIDStr, sort)
}

// Manage Orders Service
func (s *Service) GetAllOrders(search string, statusFilter string, sort string) ([]orders.Order, error) {
	return s.Repository.GetAllOrders(search, statusFilter, sort)
}

func (s *Service) GetAdminOrderByID(orderID uint) (*orders.Order, error) {
	return s.Repository.GetAdminOrderByID(orderID)
}
