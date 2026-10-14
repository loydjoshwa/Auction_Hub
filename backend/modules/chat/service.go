package chat

import (
	"errors"
	"log"
	"strings"

	"auction-hub/modules/notifications"
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
	Repository          *Repository
	OrderRepository     *orders.Repository
	NotificationService *notifications.Service
}

func NewService(
	repository *Repository,
	orderRepository *orders.Repository,
) *Service {
	return &Service{
		Repository:      repository,
		OrderRepository: orderRepository,
	}
}

// GetOrCreateConversation fetches or creates a private conversation
// for an ended auction with a winner.
func (s *Service) GetOrCreateConversation(
	auctionID uint,
	userID uint,
) (*Conversation, error) {

	// Check whether an order exists for this auction.
	order, err := s.OrderRepository.GetOrderByAuctionID(auctionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoWinnerYet
		}
		return nil, err
	}

	// Only the winning buyer and seller can access the conversation.
	if order.BuyerID != userID && order.SellerID != userID {
		return nil, ErrUnauthorizedChat
	}

	// Return the existing conversation if one exists.
	conv, err := s.Repository.GetConversationByAuctionID(auctionID)
	if err == nil && conv != nil {
		return conv, nil
	}

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create a new conversation.
	newConv := &Conversation{
		AuctionID: auctionID,
		BuyerID:   order.BuyerID,
		SellerID:  order.SellerID,
	}

	if err := s.Repository.CreateConversation(newConv); err != nil {
		return nil, err
	}

	return s.Repository.GetConversationByID(newConv.ID)
}

// GetMessages returns messages only to the conversation's buyer or seller.
func (s *Service) GetMessages(
	conversationID uint,
	userID uint,
) ([]Message, *Conversation, error) {

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

// SendMessage saves a message and notifies the other participant.
func (s *Service) SendMessage(
	conversationID uint,
	senderID uint,
	content string,
) (*Message, error) {

	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil, ErrMessageEmpty
	}

	// Find the conversation.
	conv, err := s.Repository.GetConversationByID(conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrConversationNotFound
		}
		return nil, err
	}

	// Check that the sender belongs to this conversation.
	if conv.BuyerID != senderID && conv.SellerID != senderID {
		return nil, ErrUnauthorizedChat
	}

	// Save the message.
	msg := &Message{
		ConversationID: conversationID,
		SenderID:       senderID,
		Message:        trimmed,
	}

	if err := s.Repository.CreateMessage(msg); err != nil {
		return nil, err
	}

	// Determine the recipient.
	var recipientID uint

	if senderID == conv.BuyerID {
		recipientID = conv.SellerID
	} else {
		recipientID = conv.BuyerID
	}

	// Create a notification after the message is saved.
	// Notification failure must not make a saved message appear to fail.
	if s.NotificationService != nil && recipientID != 0 {
		messagePreview := trimmed
		if len(messagePreview) > 100 {
			messagePreview = messagePreview[:100] + "..."
		}

		err := s.NotificationService.CreateNotification(
			recipientID,
			"new_message",
			"New Chat Message",
			"You received a new message: "+messagePreview,
		)

		if err != nil {
			log.Printf(
				"Failed to create chat notification for user %d: %v",
				recipientID,
				err,
			)
		}
	}

	return msg, nil
}