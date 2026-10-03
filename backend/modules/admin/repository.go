package admin

import (
	"errors"
	"strconv"
	"strings"
	"time"

	"auction-hub/database"
	"auction-hub/modules/auctions"
	"auction-hub/modules/bids"
	"auction-hub/modules/orders"
	"auction-hub/modules/products"
	"auction-hub/modules/users"

	"gorm.io/gorm"
)

var ErrProductInActiveAuction = errors.New("cannot delete product while it is in an active auction")

type DashboardAnalytics struct {
	TotalUsers     int64 `json:"totalUsers"`
	ActiveUsers    int64 `json:"activeUsers"`
	BlockedUsers   int64 `json:"blockedUsers"`
	TotalProducts  int64 `json:"totalProducts"`
	TotalAuctions  int64 `json:"totalAuctions"`
	ActiveAuctions int64 `json:"activeAuctions"`
	TotalBids      int64 `json:"totalBids"`
	TotalOrders    int64 `json:"totalOrders"`
}

type AdminAuctionItem struct {
	auctions.Auction
	Winner *users.User `json:"winner,omitempty"`
}

type AdminBidItem struct {
	bids.Bid
	IsHighest bool `json:"isHighest"`
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

// GetDashboardAnalytics calculates real platform statistics directly from the database.
func (r *Repository) GetDashboardAnalytics() (*DashboardAnalytics, error) {
	var totalUsers, activeUsers, blockedUsers int64
	var totalProducts, totalAuctions, activeAuctions, totalBids, totalOrders int64
	now := time.Now()

	r.DB.Model(&users.User{}).Count(&totalUsers)
	r.DB.Model(&users.User{}).Where("is_blocked = ?", false).Count(&activeUsers)
	r.DB.Model(&users.User{}).Where("is_blocked = ?", true).Count(&blockedUsers)
	r.DB.Model(&products.Product{}).Count(&totalProducts)
	r.DB.Model(&auctions.Auction{}).Count(&totalAuctions)
	r.DB.Model(&auctions.Auction{}).Where("status = ? AND end_time > ?", "active", now).Count(&activeAuctions)
	r.DB.Table("bids").Count(&totalBids)
	r.DB.Table("orders").Count(&totalOrders)

	return &DashboardAnalytics{
		TotalUsers:     totalUsers,
		ActiveUsers:    activeUsers,
		BlockedUsers:   blockedUsers,
		TotalProducts:  totalProducts,
		TotalAuctions:  totalAuctions,
		ActiveAuctions: activeAuctions,
		TotalBids:      totalBids,
		TotalOrders:    totalOrders,
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

// Manage Products Methods
func (r *Repository) GetAllProducts(search string, statusFilter string, inAuctionFilter string, sort string) ([]products.Product, error) {
	var productList []products.Product

	query := r.DB.Preload("User")

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR user_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?)",
			pattern, pattern, pattern, pattern,
		)
	}

	statusFilter = strings.TrimSpace(statusFilter)
	if statusFilter != "" && strings.ToLower(statusFilter) != "all" {
		query = query.Where("LOWER(status) = ?", strings.ToLower(statusFilter))
	}

	inAuctionFilter = strings.TrimSpace(inAuctionFilter)
	if inAuctionFilter == "true" {
		query = query.Where("status = ?", "In Auction")
	} else if inAuctionFilter == "false" {
		query = query.Where("status != ?", "In Auction")
	}

	switch strings.ToLower(sort) {
	case "oldest":
		query = query.Order("created_at ASC")
	case "name":
		query = query.Order("name ASC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Find(&productList).Error
	if err != nil {
		return nil, err
	}
	return productList, nil
}

func (r *Repository) LogAdminAction(adminUserID uint, actionType, entityType string, entityID uint, reason string) error {
	if adminUserID == 0 {
		adminUserID = 1
	}
	actionLog := AdminActionLog{
		AdminUserID: adminUserID,
		ActionType:  actionType,
		EntityType:  entityType,
		EntityID:    entityID,
		Reason:      reason,
		CreatedAt:   time.Now(),
	}
	return r.DB.Create(&actionLog).Error
}

func (r *Repository) DeleteProduct(adminUserID uint, productID uint, reason string) error {
	var activeCount int64
	now := time.Now()
	r.DB.Table("auctions").
		Where("product_id = ? AND status = ? AND end_time > ?", productID, "active", now).
		Count(&activeCount)

	if activeCount > 0 {
		return ErrProductInActiveAuction
	}

	result := r.DB.Delete(&products.Product{}, productID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	if reason != "" {
		_ = r.LogAdminAction(adminUserID, "REMOVE_PRODUCT", "PRODUCT", productID, reason)
	}

	return nil
}

// Manage Auctions Methods
func (r *Repository) GetAllAuctions(search string, statusFilter string, sort string) ([]AdminAuctionItem, error) {
	aucRepo := auctions.NewRepository()
	aucRepo.EvaluateExpiredAuctions()

	var auctionList []auctions.Auction
	query := r.DB.Preload("Product").Preload("Seller")

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR seller_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?)",
			pattern, pattern, pattern, pattern,
		)
	}

	now := time.Now()
	statusFilter = strings.ToLower(strings.TrimSpace(statusFilter))
	if statusFilter == "active" {
		query = query.Where("status = ? AND end_time > ?", "active", now)
	} else if statusFilter == "paused" {
		query = query.Where("status = ?", "paused")
	} else if statusFilter == "completed" || statusFilter == "ended" {
		query = query.Where("status = ? OR end_time <= ?", "completed", now)
	}

	switch strings.ToLower(sort) {
	case "oldest":
		query = query.Order("created_at ASC")
	case "price_high":
		query = query.Order("current_price DESC")
	case "price_low":
		query = query.Order("current_price ASC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Find(&auctionList).Error
	if err != nil {
		return nil, err
	}

	var result []AdminAuctionItem
	for i := range auctionList {
		var count int64
		r.DB.Table("bids").Where("auction_id = ?", auctionList[i].ID).Count(&count)
		auctionList[i].BidCount = count

		item := AdminAuctionItem{
			Auction: auctionList[i],
		}

		if auctionList[i].Status == "completed" || time.Now().After(auctionList[i].EndTime) {
			type WinnerResult struct {
				BuyerID uint
			}
			var winRes WinnerResult
			errWin := r.DB.Table("orders").Select("buyer_id").Where("auction_id = ?", auctionList[i].ID).First(&winRes).Error
			if errWin == nil && winRes.BuyerID > 0 {
				var winnerUser users.User
				r.DB.Select("id", "name", "email", "role").First(&winnerUser, winRes.BuyerID)
				item.Winner = &winnerUser
			}
		}

		result = append(result, item)
	}

	return result, nil
}

func (r *Repository) CancelAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	var auction auctions.Auction
	if err := r.DB.First(&auction, auctionID).Error; err != nil {
		return nil, err
	}

	auction.Status = "completed"
	auction.EndTime = time.Now()
	if err := r.DB.Save(&auction).Error; err != nil {
		return nil, err
	}

	aucRepo := auctions.NewRepository()
	aucRepo.EvaluateExpiredAuctions()

	if reason != "" {
		_ = r.LogAdminAction(adminUserID, "CANCEL_AUCTION", "AUCTION", auctionID, reason)
	}

	return &auction, nil
}

func (r *Repository) PauseAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	var auction auctions.Auction
	if err := r.DB.First(&auction, auctionID).Error; err != nil {
		return nil, err
	}

	if strings.ToLower(auction.Status) != "active" {
		return nil, errors.New("Only active auctions can be paused.")
	}

	if strings.TrimSpace(reason) == "" {
		return nil, errors.New("A reason is required to pause this auction.")
	}

	now := time.Now()
	auction.Status = "paused"
	auction.PausedAt = &now

	if err := r.DB.Save(&auction).Error; err != nil {
		return nil, err
	}

	_ = r.LogAdminAction(adminUserID, "PAUSE_AUCTION", "AUCTION", auctionID, reason)

	return &auction, nil
}

func (r *Repository) ResumeAuction(adminUserID uint, auctionID uint, reason string) (*auctions.Auction, error) {
	var auction auctions.Auction
	if err := r.DB.First(&auction, auctionID).Error; err != nil {
		return nil, err
	}

	if strings.ToLower(auction.Status) != "paused" {
		return nil, errors.New("Only paused auctions can be resumed.")
	}

	if strings.TrimSpace(reason) == "" {
		return nil, errors.New("A reason is required to resume this auction.")
	}

	now := time.Now()
	if auction.PausedAt != nil {
		pausedDuration := now.Sub(*auction.PausedAt)
		auction.EndTime = auction.EndTime.Add(pausedDuration)
		auction.PausedAt = nil
	}

	auction.Status = "active"

	if err := r.DB.Save(&auction).Error; err != nil {
		return nil, err
	}

	_ = r.LogAdminAction(adminUserID, "RESUME_AUCTION", "AUCTION", auctionID, reason)

	return &auction, nil
}

// Manage Bids Methods
func (r *Repository) GetAllBids(search string, auctionIDStr string, bidderIDStr string, sort string) ([]AdminBidItem, error) {
	aucRepo := auctions.NewRepository()
	aucRepo.EvaluateExpiredAuctions()

	var bidsList []bids.Bid
	query := r.DB.
		Preload("User").
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Auction.Seller")

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"user_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?) OR auction_id IN (SELECT id FROM auctions WHERE LOWER(title) LIKE ?)",
			pattern, pattern, pattern,
		)
	}

	if auctionIDStr != "" {
		if aID, err := strconv.ParseUint(auctionIDStr, 10, 64); err == nil && aID > 0 {
			query = query.Where("auction_id = ?", uint(aID))
		}
	}

	if bidderIDStr != "" {
		if bID, err := strconv.ParseUint(bidderIDStr, 10, 64); err == nil && bID > 0 {
			query = query.Where("user_id = ?", uint(bID))
		}
	}

	switch strings.ToLower(sort) {
	case "oldest":
		query = query.Order("created_at ASC")
	case "highest":
		query = query.Order("amount DESC")
	case "lowest":
		query = query.Order("amount ASC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Find(&bidsList).Error
	if err != nil {
		return nil, err
	}

	highestPerAuction := make(map[uint]float64)
	for _, b := range bidsList {
		if max, exists := highestPerAuction[b.AuctionID]; !exists || b.Amount > max {
			highestPerAuction[b.AuctionID] = b.Amount
		}
	}

	var result []AdminBidItem
	for _, b := range bidsList {
		isHighest := b.Amount >= highestPerAuction[b.AuctionID]
		result = append(result, AdminBidItem{
			Bid:       b,
			IsHighest: isHighest,
		})
	}

	return result, nil
}

// Manage Orders Methods
func (r *Repository) GetAllOrders(search string, statusFilter string, sort string) ([]orders.Order, error) {
	var ordersList []orders.Order
	query := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller")

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"buyer_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?) OR seller_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?) OR auction_id IN (SELECT id FROM auctions WHERE LOWER(title) LIKE ?)",
			pattern, pattern, pattern, pattern, pattern,
		)
	}

	statusFilter = strings.TrimSpace(statusFilter)
	if statusFilter != "" && strings.ToLower(statusFilter) != "all" {
		query = query.Where("LOWER(status) = ?", strings.ToLower(statusFilter))
	}

	switch strings.ToLower(sort) {
	case "oldest":
		query = query.Order("created_at ASC")
	case "amount_high":
		query = query.Order("final_amount DESC")
	case "amount_low":
		query = query.Order("final_amount ASC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Find(&ordersList).Error
	if err != nil {
		return nil, err
	}

	return ordersList, nil
}

func (r *Repository) GetAdminOrderByID(orderID uint) (*orders.Order, error) {
	var order orders.Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		First(&order, orderID).Error

	if err != nil {
		return nil, err
	}

	return &order, nil
}
