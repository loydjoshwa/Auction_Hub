package reports

import (
	"strings"

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

func (r *Repository) CreateReport(report *Report) error {
	return r.DB.Create(report).Error
}

func (r *Repository) GetReportByID(id uint) (*Report, error) {
	var rep Report
	err := r.DB.
		Preload("Reporter").
		Preload("Reported").
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Auction.Seller").
		Preload("Admin").
		First(&rep, id).Error
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *Repository) GetPendingOrReviewingReport(reporterID uint, auctionID uint) (*Report, error) {
	var rep Report
	err := r.DB.
		Where("reporter_id = ? AND auction_id = ? AND status IN ?", reporterID, auctionID, []string{"pending", "reviewing"}).
		First(&rep).Error
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *Repository) GetAllReports(search string, statusFilter string, sort string) ([]Report, error) {
	var reportList []Report
	query := r.DB.
		Preload("Reporter").
		Preload("Reported").
		Preload("Auction").
		Preload("Auction.Product").
		Preload("Auction.Seller").
		Preload("Admin")

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(reason) LIKE ? OR LOWER(description) LIKE ? OR reporter_id IN (SELECT id FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?) OR auction_id IN (SELECT id FROM auctions WHERE LOWER(title) LIKE ?)",
			pattern, pattern, pattern, pattern, pattern,
		)
	}

	statusFilter = strings.ToLower(strings.TrimSpace(statusFilter))
	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("LOWER(status) = ?", statusFilter)
	}

	switch strings.ToLower(sort) {
	case "oldest":
		query = query.Order("created_at ASC")
	default:
		query = query.Order("created_at DESC")
	}

	err := query.Find(&reportList).Error
	if err != nil {
		return nil, err
	}
	return reportList, nil
}

func (r *Repository) GetUserReports(reporterID uint) ([]Report, error) {
	var reportList []Report
	err := r.DB.
		Preload("Auction").
		Preload("Auction.Product").
		Where("reporter_id = ?", reporterID).
		Order("created_at DESC").
		Find(&reportList).Error
	if err != nil {
		return nil, err
	}
	return reportList, nil
}

func (r *Repository) UpdateReport(report *Report) error {
	return r.DB.Save(report).Error
}
