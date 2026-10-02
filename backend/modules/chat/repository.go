package chat

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

func (r *Repository) GetConversationByAuctionID(auctionID uint) (*Conversation, error) {
	var conv Conversation
	err := r.DB.
		Preload("Buyer").
		Preload("Seller").
		Where("auction_id = ?", auctionID).
		First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *Repository) CreateConversation(conv *Conversation) error {
	return r.DB.Create(conv).Error
}

func (r *Repository) GetConversationByID(id uint) (*Conversation, error) {
	var conv Conversation
	err := r.DB.
		Preload("Buyer").
		Preload("Seller").
		First(&conv, id).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *Repository) GetMessagesByConversationID(convID uint) ([]Message, error) {
	var messages []Message
	err := r.DB.
		Preload("Sender").
		Where("conversation_id = ?", convID).
		Order("created_at ASC").
		Find(&messages).Error
	if err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *Repository) CreateMessage(msg *Message) error {
	return r.DB.Create(msg).Error
}
