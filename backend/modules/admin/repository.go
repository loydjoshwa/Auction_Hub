package admin

import (
	"strings"

	"auction-hub/database"
	"auction-hub/modules/users"

	"gorm.io/gorm"
)

type DashboardAnalytics struct {
	TotalUsers   int64 `json:"totalUsers"`
	ActiveUsers  int64 `json:"activeUsers"`
	BlockedUsers int64 `json:"blockedUsers"`
}

type Repository struct {
	DB *gorm.DB
}

func NewRepository() *Repository {
	return &Repository{
		DB: database.DB,
	}
}

// GetAllUsers returns all users matching search and status filters without exposing passwords.
func (r *Repository) GetAllUsers(search string, status string) ([]users.User, error) {
	var userList []users.User

	query := r.DB.
		Select("id", "name", "email", "role", "is_blocked", "created_at", "updated_at").
		Order("created_at DESC")

	search = strings.TrimSpace(search)
	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", searchPattern, searchPattern)
	}

	status = strings.ToLower(strings.TrimSpace(status))
	if status == "active" {
		query = query.Where("is_blocked = ?", false)
	} else if status == "blocked" {
		query = query.Where("is_blocked = ?", true)
	}

	err := query.Find(&userList).Error
	if err != nil {
		return nil, err
	}

	return userList, nil
}

// GetDashboardAnalytics calculates user statistics directly from the database.
func (r *Repository) GetDashboardAnalytics() (*DashboardAnalytics, error) {
	var totalUsers, activeUsers, blockedUsers int64

	if err := r.DB.Model(&users.User{}).Count(&totalUsers).Error; err != nil {
		return nil, err
	}

	if err := r.DB.Model(&users.User{}).Where("is_blocked = ?", false).Count(&activeUsers).Error; err != nil {
		return nil, err
	}

	if err := r.DB.Model(&users.User{}).Where("is_blocked = ?", true).Count(&blockedUsers).Error; err != nil {
		return nil, err
	}

	return &DashboardAnalytics{
		TotalUsers:   totalUsers,
		ActiveUsers:  activeUsers,
		BlockedUsers: blockedUsers,
	}, nil
}

// GetUserByID returns a single user without exposing the password.
func (r *Repository) GetUserByID(userID uint) (*users.User, error) {
	var user users.User

	err := r.DB.
		Select("id", "name", "email", "role", "is_blocked", "created_at", "updated_at").
		First(&user, userID).Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// SetUserBlockedStatus updates the IsBlocked field for a target user.
func (r *Repository) SetUserBlockedStatus(userID uint, isBlocked bool) (*users.User, error) {
	var user users.User

	err := r.DB.First(&user, userID).Error
	if err != nil {
		return nil, err
	}

	err = r.DB.Model(&user).Update("is_blocked", isBlocked).Error
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(userID)
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