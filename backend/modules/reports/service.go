package reports

import (
	"errors"
	"strings"
	"time"

	"auction-hub/modules/auctions"
)

var (
	ErrReasonRequired      = errors.New("Reason is required")
	ErrDescriptionRequired = errors.New("Description is required")
	ErrAuctionNotFound     = errors.New("Auction not found")
	ErrReportAlreadyExists = errors.New("You have already submitted a report for this auction that is under review")
	ErrInvalidReportStatus = errors.New("Invalid report status")
	ErrAdminReasonRequired = errors.New("A reason/note is required to update the report status")
)

type Service struct {
	Repository        *Repository
	AuctionRepository *auctions.Repository
}

func NewService(repository *Repository, auctionRepository *auctions.Repository) *Service {
	return &Service{
		Repository:        repository,
		AuctionRepository: auctionRepository,
	}
}

func (s *Service) CreateReport(reporterID uint, auctionID uint, reason string, description string) (*Report, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, ErrReasonRequired
	}

	description = strings.TrimSpace(description)
	if description == "" {
		return nil, ErrDescriptionRequired
	}

	auc, err := s.AuctionRepository.GetAuctionByID(auctionID)
	if err != nil || auc == nil {
		return nil, ErrAuctionNotFound
	}

	// Spam prevention: check if user already has an active pending/reviewing report for this auction
	existing, err := s.Repository.GetPendingOrReviewingReport(reporterID, auctionID)
	if err == nil && existing != nil {
		return nil, ErrReportAlreadyExists
	}

	report := &Report{
		ReporterID:  reporterID,
		ReportedID:  auc.SellerID,
		AuctionID:   auctionID,
		Reason:      reason,
		Description: description,
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.Repository.CreateReport(report); err != nil {
		return nil, err
	}

	return s.Repository.GetReportByID(report.ID)
}

func (s *Service) GetAllReports(search string, status string, sort string) ([]Report, error) {
	return s.Repository.GetAllReports(search, status, sort)
}

func (s *Service) GetReportByID(id uint) (*Report, error) {
	return s.Repository.GetReportByID(id)
}

func (s *Service) GetUserReports(reporterID uint) ([]Report, error) {
	return s.Repository.GetUserReports(reporterID)
}

func (s *Service) UpdateReportStatus(adminID uint, reportID uint, status string, adminReason string) (*Report, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "pending" && status != "reviewing" && status != "resolved" && status != "rejected" {
		return nil, ErrInvalidReportStatus
	}

	adminReason = strings.TrimSpace(adminReason)
	if adminReason == "" {
		return nil, ErrAdminReasonRequired
	}

	report, err := s.Repository.GetReportByID(reportID)
	if err != nil {
		return nil, err
	}

	report.Status = status
	report.AdminReason = adminReason
	report.AdminID = &adminID
	report.UpdatedAt = time.Now()

	if err := s.Repository.UpdateReport(report); err != nil {
		return nil, err
	}

	return s.Repository.GetReportByID(reportID)
}
