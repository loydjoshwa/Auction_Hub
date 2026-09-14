package auth

import (
	"auction-hub/database"
	"auction-hub/modules/users"

	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

func NewRepository() *Repository {
	return &Repository{
		DB: database.DB,
	}
}

func (r *Repository) FindUserByEmail(email string) (*users.User, error) {
	var user users.User

	err := r.DB.Where("email = ?", email).First(&user).Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) CreateUser(user *users.User) error {
	return r.DB.Create(user).Error
}

func (r *Repository) UpdatePassword(email string, hashedPassword string) error {
	return r.DB.Model(&users.User{}).Where("email = ?", email).Update("password", hashedPassword).Error
}