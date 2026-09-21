package admin

import "auction-hub/modules/users"

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

// GetAllUsers gets all users for the admin.
func (s *Service) GetAllUsers() ([]users.User, error) {
	return s.Repository.GetAllUsers()
}