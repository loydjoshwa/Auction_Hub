package orders

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

func (r *Repository) GetUserOrders(userID uint) ([]Order, error) {
	var ordersList []Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		Where("buyer_id = ? OR seller_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&ordersList).Error

	if err != nil {
		return nil, err
	}
	return ordersList, nil
}

func (r *Repository) GetBuyerOrders(userID uint) ([]Order, error) {
	var ordersList []Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		Where("buyer_id = ?", userID).
		Order("created_at DESC").
		Find(&ordersList).Error

	if err != nil {
		return nil, err
	}
	return ordersList, nil
}

func (r *Repository) GetSellerOrders(userID uint) ([]Order, error) {
	var ordersList []Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		Where("seller_id = ?", userID).
		Order("created_at DESC").
		Find(&ordersList).Error

	if err != nil {
		return nil, err
	}
	return ordersList, nil
}

func (r *Repository) GetMyOrders(userID uint) ([]Order, []Order, error) {
	buyerOrders, err := r.GetBuyerOrders(userID)
	if err != nil {
		return nil, nil, err
	}
	sellerOrders, err := r.GetSellerOrders(userID)
	if err != nil {
		return nil, nil, err
	}
	return buyerOrders, sellerOrders, nil
}

func (r *Repository) AddTrackingHistory(orderID uint, status string, updatedBy string, updatedByID uint, reason string) error {
	history := OrderTrackingHistory{
		OrderID:     orderID,
		Status:      status,
		UpdatedBy:   updatedBy,
		UpdatedByID: updatedByID,
		Reason:      reason,
	}
	return r.DB.Create(&history).Error
}

func (r *Repository) EnsureTrackingHistorySeeded(order *Order) {
	if order == nil || order.ID == 0 {
		return
	}
	var count int64
	r.DB.Model(&OrderTrackingHistory{}).Where("order_id = ?", order.ID).Count(&count)
	if count > 0 {
		return
	}

	// Seed historical steps for clean initial display
	r.DB.Create(&OrderTrackingHistory{
		OrderID:     order.ID,
		Status:      "Pending Address",
		UpdatedBy:   "System",
		UpdatedByID: 0,
		Reason:      "Order created upon auction completion",
	})

	if order.DeliveryAddress != "" || order.Status == "Address Added" || order.Status == "Packed" || order.Status == "Shipped" || order.Status == "Delivered" {
		r.DB.Create(&OrderTrackingHistory{
			OrderID:     order.ID,
			Status:      "Address Added",
			UpdatedBy:   "Buyer",
			UpdatedByID: order.BuyerID,
			Reason:      "Delivery address added",
		})
	}

	if order.Status == "Packed" || order.Status == "Shipped" || order.Status == "Delivered" {
		r.DB.Create(&OrderTrackingHistory{
			OrderID:     order.ID,
			Status:      "Packed",
			UpdatedBy:   "Seller",
			UpdatedByID: order.SellerID,
			Reason:      "Order packed for shipment",
		})
	}

	if order.Status == "Shipped" || order.Status == "Delivered" {
		r.DB.Create(&OrderTrackingHistory{
			OrderID:     order.ID,
			Status:      "Shipped",
			UpdatedBy:   "Seller",
			UpdatedByID: order.SellerID,
			Reason:      "Order shipped to buyer",
		})
	}

	if order.Status == "Delivered" {
		r.DB.Create(&OrderTrackingHistory{
			OrderID:     order.ID,
			Status:      "Delivered",
			UpdatedBy:   "Buyer",
			UpdatedByID: order.BuyerID,
			Reason:      "Item delivered successfully",
		})
	}
}

func (r *Repository) GetOrderByID(orderID uint) (*Order, error) {
	var order Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		Preload("TrackingHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		First(&order, orderID).Error

	if err != nil {
		return nil, err
	}

	if len(order.TrackingHistory) == 0 {
		r.EnsureTrackingHistorySeeded(&order)
		r.DB.Preload("TrackingHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).First(&order, orderID)
	}

	return &order, nil
}

func (r *Repository) GetOrderByAuctionID(auctionID uint) (*Order, error) {
	var order Order
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Buyer").
		Preload("Seller").
		Preload("TrackingHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Where("auction_id = ?", auctionID).
		First(&order).Error

	if err != nil {
		return nil, err
	}

	if len(order.TrackingHistory) == 0 {
		r.EnsureTrackingHistorySeeded(&order)
		r.DB.Preload("TrackingHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).Where("auction_id = ?", auctionID).First(&order)
	}

	return &order, nil
}

func (r *Repository) UpdateOrder(order *Order) error {
	return r.DB.Save(order).Error
}

