package users

type Service struct {
	Repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

func (s *Service) GetUserByID(userID interface{}) (*User, error) {

	user, err := s.Repository.FindUserByID(userID)

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) UpdateUserProfile(userID interface{}, name string) (*User, error) {
	return s.Repository.UpdateUserName(userID, name)
}