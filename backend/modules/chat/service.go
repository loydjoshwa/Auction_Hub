package chat

import (
	"errors"
	"strings"

	"auction-hub/modules/orders"

	"gorm.io/gorm"
)

var (
	ErrConversationNotFound = errors.New("Conversation not found.")
	ErrUnauthorizedChat     = errors.New("You do not have access to this conversation.")
	ErrNoWinnerYet          = errors.New("Chat is available only after an auction has ended with a winner.")
	ErrMessageEmpty         = errors.New("Message content cannot be empty.")
)

type Service struct {
	Repository      *Repository
	OrderRepository *orders.Repository
}

func NewService(repository *Repository, orderRepository *orders.Repository) *Service {
	return &Service{
		Repository:      repository,
		OrderRepository: orderRepository,
	}
}

// GetOrCreateConversation fetches or creates a private chat conversation for an ended auction with a winner.
func (s *Service) GetOrCreateConversation(auctionID uint, userID uint) (*Conversation, error) {
	// 1. Check if order exists for this auction
	order, err := s.OrderRepository.GetOrderByAuctionID(auctionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoWinnerYet
		}
		return nil, err
	}

	// 2. Strict Access Control: User must be winning buyer or seller
	if order.BuyerID != userID && order.SellerID != userID {
		return nil, ErrUnauthorizedChat
	}

	// 3. Get existing conversation or create one
	conv, err := s.Repository.GetConversationByAuctionID(auctionID)
	if err == nil && conv != nil {
		return conv, nil
	}

	// Create new conversation
	newConv := &Conversation{
		AuctionID: auctionID,
		BuyerID:   order.BuyerID,
		SellerID:  order.SellerID,
	}

	err = s.Repository.CreateConversation(newConv)
	if err != nil {
		return nil, err
	}

	return s.Repository.GetConversationByID(newConv.ID)
}

func (s *Service) GetMessages(conversationID uint, userID uint) ([]Message, *Conversation, error) {
	conv, err := s.Repository.GetConversationByID(conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrConversationNotFound
		}
		return nil, nil, err
	}

	if conv.BuyerID != userID && conv.SellerID != userID {
		return nil, nil, ErrUnauthorizedChat
	}

	messages, err := s.Repository.GetMessagesByConversationID(conversationID)
	if err != nil {
		return nil, nil, err
	}

	return messages, conv, nil
}

func (s *Service) SendMessage(conversationID uint, senderID uint, content string) (*Message, error) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil, ErrMessageEmpty
	}

	conv, err := s.Repository.GetConversationByID(conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConversationNotFound
		}
		return nil, err
	}

	if conv.BuyerID != senderID && conv.SellerID != senderID {
		return nil, ErrUnauthorizedChat
	}

	msg := &Message{
		ConversationID: conversationID,
		SenderID:       senderID,
		Message:        trimmed,
	}

	err = s.Repository.CreateMessage(msg)
	if err != nil {
		return nil, err
	}

	return msg, nil
}
