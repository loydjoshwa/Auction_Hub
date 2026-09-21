package admin

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

// GetAllUsers returns all users without exposing passwords.
func (r *Repository) GetAllUsers() ([]users.User, error) {
	var userList []users.User

	err := r.DB.
		Select("id", "name", "email", "role", "created_at", "updated_at").
		Order("created_at DESC").
		Find(&userList).Error

	if err != nil {
		return nil, err
	}

	return userList, nil
}

// GetUserByID returns a single user without exposing the password.
func (r *Repository) GetUserByID(userID uint) (*users.User, error) {
	var user users.User

	err := r.DB.
		Select("id", "name", "email", "role", "created_at", "updated_at").
		First(&user, userID).Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUserRole changes the role of an existing user.
func (r *Repository) UpdateUserRole(userID uint, role string) (*users.User, error) {
	var user users.User

	err := r.DB.First(&user, userID).Error
	if err != nil {
		return nil, err
	}

	err = r.DB.Model(&user).Update("role", role).Error
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(userID)
}

// DeleteUser permanently deletes a user.
func (r *Repository) DeleteUser(userID uint) error {
	result := r.DB.Delete(&users.User{}, userID)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}