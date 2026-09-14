package users

import (
	"auction-hub/database"

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

func (r *Repository) FindUserByID(userID interface{}) (*User, error) {
	var user User
	var err error

	switch v := userID.(type) {
	case float64:
		err = r.DB.First(&user, uint(v)).Error
	case int:
		err = r.DB.First(&user, uint(v)).Error
	case uint:
		err = r.DB.First(&user, v).Error
	default:
		err = r.DB.First(&user, userID).Error
	}

	if err != nil {
		return nil, err
	}

	return &user, nil
}