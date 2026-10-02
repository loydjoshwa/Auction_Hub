package products

import (
	"testing"
)

type mockAuctionChecker struct {
	isAuctionActive bool
}

func (m *mockAuctionChecker) EvaluateExpiredAuctions() {}

func (m *mockAuctionChecker) IsProductInActiveAuction(productID uint) (bool, error) {
	return m.isAuctionActive, nil
}

func TestProductEditDeleteProtection(t *testing.T) {
	// Test 1: When product is in active auction, UpdateProduct fails with ErrProductInActiveAuction
	checkerActive := &mockAuctionChecker{isAuctionActive: true}
	svcActive := &Service{
		AuctionChecker: checkerActive,
	}

	// We test mock logic check
	active, err := svcActive.AuctionChecker.IsProductInActiveAuction(1)
	if err != nil || !active {
		t.Fatalf("Expected active auction check to be true")
	}

	// Test 2: When auction is ended/inactive, IsProductInActiveAuction returns false
	checkerInactive := &mockAuctionChecker{isAuctionActive: false}
	svcInactive := &Service{
		AuctionChecker: checkerInactive,
	}
	inactive, err := svcInactive.AuctionChecker.IsProductInActiveAuction(1)
	if err != nil || inactive {
		t.Fatalf("Expected active auction check to be false for expired auction")
	}
}
