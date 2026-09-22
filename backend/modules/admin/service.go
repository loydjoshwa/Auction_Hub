package admin

import (
	"errors"

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