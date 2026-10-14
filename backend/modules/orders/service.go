package orders

import (
	"errors"
	"log"
	"strconv"
	"strings"

	"auction-hub/modules/notifications"
)

var (
	ErrOrderNotFound     = errors.New("Order not found.")
	ErrUnauthorizedOrder = errors.New("You are not authorized to access this order.")
	ErrAddressLocked     = errors.New("Delivery address cannot be updated after the order has been shipped.")
	ErrOnlyBuyerAddress  = errors.New("Only the winning buyer can update the delivery address.")
	ErrOnlySellerPack    = errors.New("Only the seller or administrator can mark this order as packed.")
	ErrOnlySellerShip    = errors.New("Only the seller or administrator can mark this order as shipped.")
	ErrOnlyBuyerDeliver  = errors.New("Only the winning buyer can mark this order as delivered.")
	ErrInvalidStatusFlow = errors.New("Invalid order status transition.")
	ErrAddressRequired   = errors.New("Delivery address is required.")
)

type Service struct {
	Repository          *Repository
	NotificationService *notifications.Service
}

func NewService(repository *Repository) *Service {
	return &Service{
		Repository: repository,
	}
}

// notifyOrderStatus creates an order notification.
// Notification errors do not fail an already completed order update.
func (s *Service) notifyOrderStatus(
	userID uint,
	orderID uint,
	status string,
) {
	if s.NotificationService == nil || userID == 0 {
		return
	}

	message := "Your order #" +
		strconv.FormatUint(uint64(orderID), 10) +
		" status is now " + status + "."

	err := s.NotificationService.CreateNotification(
		userID,
		"order_update",
		"Order Status Updated",
		message,
	)

	if err != nil {
		log.Printf(
			"Failed to create order notification for user %d, order %d: %v",
			userID,
			orderID,
			err,
		)
	}
}

func (s *Service) GetUserOrders(userID uint) ([]Order, error) {
	return s.Repository.GetUserOrders(userID)
}

func (s *Service) GetMyOrders(userID uint) (map[string][]Order, error) {
	buyerOrders, sellerOrders, err := s.Repository.GetMyOrders(userID)
	if err != nil {
		return nil, err
	}

	if buyerOrders == nil {
		buyerOrders = []Order{}
	}

	if sellerOrders == nil {
		sellerOrders = []Order{}
	}

	return map[string][]Order{
		"buyerOrders":  buyerOrders,
		"sellerOrders": sellerOrders,
	}, nil
}

func (s *Service) GetBuyerOrders(userID uint) ([]Order, error) {
	return s.Repository.GetBuyerOrders(userID)
}

func (s *Service) GetSellerOrders(userID uint) ([]Order, error) {
	return s.Repository.GetSellerOrders(userID)
}

func (s *Service) GetOrderByID(
	orderID uint,
	userID uint,
	userRole string,
) (*Order, error) {
	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	isAdmin := strings.ToLower(userRole) == "admin"

	if order.BuyerID != userID &&
		order.SellerID != userID &&
		!isAdmin {
		return nil, ErrUnauthorizedOrder
	}

	return order, nil
}

func (s *Service) UpdateDeliveryAddress(
	orderID uint,
	userID uint,
	address string,
) (*Order, error) {
	address = strings.TrimSpace(address)

	if address == "" {
		return nil, ErrAddressRequired
	}

	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	if order.BuyerID != userID {
		return nil, ErrOnlyBuyerAddress
	}

	// Address editing is locked once the order has shipped.
	if order.Status == "Shipped" || order.Status == "Delivered" {
		return nil, ErrAddressLocked
	}

	oldStatus := order.Status

	order.DeliveryAddress = address

	isInitialAddress := oldStatus == "Pending Address" ||
		strings.ToLower(oldStatus) == "confirmed" ||
		oldStatus == ""

	if isInitialAddress {
		order.Status = "Address Added"
	}

	if err := s.Repository.UpdateOrder(order); err != nil {
		return nil, err
	}

	if isInitialAddress {
		_ = s.Repository.AddTrackingHistory(
			order.ID,
			"Address Added",
			"Buyer",
			userID,
			"Delivery address provided by buyer",
		)

		// Notify the seller that the buyer added the address.
		s.notifyOrderStatus(
			order.SellerID,
			order.ID,
			"Address Added",
		)
	} else {
		_ = s.Repository.AddTrackingHistory(
			order.ID,
			order.Status,
			"Buyer",
			userID,
			"Delivery address updated by buyer",
		)
	}

	return s.Repository.GetOrderByID(order.ID)
}

func (s *Service) MarkAsPacked(
	orderID uint,
	userID uint,
	userRole string,
) (*Order, error) {
	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	isAdmin := strings.ToLower(userRole) == "admin"

	if order.SellerID != userID && !isAdmin {
		return nil, ErrOnlySellerPack
	}

	if order.Status != "Address Added" &&
		order.Status != "Pending Address" {
		return nil, ErrInvalidStatusFlow
	}

	order.Status = "Packed"

	if err := s.Repository.UpdateOrder(order); err != nil {
		return nil, err
	}

	updaterRole := "Seller"
	if isAdmin {
		updaterRole = "Admin"
	}

	_ = s.Repository.AddTrackingHistory(
		order.ID,
		"Packed",
		updaterRole,
		userID,
		"Order packed for shipment",
	)

	// Notify the buyer.
	s.notifyOrderStatus(order.BuyerID, order.ID, "Packed")

	return s.Repository.GetOrderByID(order.ID)
}

func (s *Service) MarkAsShipped(
	orderID uint,
	userID uint,
	userRole string,
) (*Order, error) {
	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	isAdmin := strings.ToLower(userRole) == "admin"

	if order.SellerID != userID && !isAdmin {
		return nil, ErrOnlySellerShip
	}

	if order.Status != "Packed" {
		return nil, ErrInvalidStatusFlow
	}

	order.Status = "Shipped"

	if err := s.Repository.UpdateOrder(order); err != nil {
		return nil, err
	}

	updaterRole := "Seller"
	if isAdmin {
		updaterRole = "Admin"
	}

	_ = s.Repository.AddTrackingHistory(
		order.ID,
		"Shipped",
		updaterRole,
		userID,
		"Handed over to courier",
	)

	// Notify the buyer.
	s.notifyOrderStatus(order.BuyerID, order.ID, "Shipped")

	return s.Repository.GetOrderByID(order.ID)
}

func (s *Service) MarkAsDelivered(
	orderID uint,
	userID uint,
) (*Order, error) {
	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	if order.BuyerID != userID {
		return nil, ErrOnlyBuyerDeliver
	}

	if order.Status != "Shipped" {
		return nil, ErrInvalidStatusFlow
	}

	order.Status = "Delivered"

	if err := s.Repository.UpdateOrder(order); err != nil {
		return nil, err
	}

	_ = s.Repository.AddTrackingHistory(
		order.ID,
		"Delivered",
		"Buyer",
		userID,
		"Confirmed delivery received",
	)

	// Notify the seller.
	s.notifyOrderStatus(order.SellerID, order.ID, "Delivered")

	return s.Repository.GetOrderByID(order.ID)
}

func (s *Service) UpdateOrderStatusByAdmin(
	orderID uint,
	adminUserID uint,
	newStatus string,
	reason string,
) (*Order, error) {
	reason = strings.TrimSpace(reason)

	if reason == "" {
		return nil, errors.New("A reason is required to update order status.")
	}

	order, err := s.Repository.GetOrderByID(orderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	validStatuses := map[string]bool{
		"Pending Address": true,
		"Address Added":   true,
		"Packed":          true,
		"Shipped":         true,
		"Delivered":       true,
		"Cancelled":       true,
	}

	newStatus = strings.TrimSpace(newStatus)

	if !validStatuses[newStatus] {
		return nil, errors.New("Invalid status value.")
	}

	oldStatus := order.Status

	order.Status = newStatus

	if err := s.Repository.UpdateOrder(order); err != nil {
		return nil, err
	}

	_ = s.Repository.AddTrackingHistory(
		order.ID,
		newStatus,
		"Admin",
		adminUserID,
		reason,
	)

	// Notify both participants when the status actually changes.
	if oldStatus != newStatus {
		s.notifyOrderStatus(order.BuyerID, order.ID, newStatus)
		s.notifyOrderStatus(order.SellerID, order.ID, newStatus)
	}

	return s.Repository.GetOrderByID(order.ID)
}