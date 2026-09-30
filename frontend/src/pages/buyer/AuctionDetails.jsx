import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldError, setFieldError] = useState("");

  const [timeLeft, setTimeLeft] = useState({
    formatted: "",
    isExpired: false,
  });

  // Fetch auction and bids data
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        apiService.getAuctionById(token, id),
        apiService.getAuctionBids(token, id).catch(() => ({ bids: [] })),
      ]);

      if (auctionRes.auction) {
        setAuction(auctionRes.auction);
      } else {
        setError("Auction details not found.");
      }

      setBids(bidsRes.bids || []);
    } catch (err) {
      setError(err.message || "Failed to load auction details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchData();
    }
  }, [token, id]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!auction?.endTime) return;

    const updateTimer = () => {
      const end = new Date(auction.endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ formatted: "Auction Ended", isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let formattedStr = "";
      if (days > 0) {
        formattedStr = `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
      } else {
        formattedStr = `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
      }

      setTimeLeft({ formatted: formattedStr, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction?.endTime]);

  const isSeller = user && auction && (user.id === auction.sellerId || user.id === auction.seller?.id);

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setFieldError("");

    const numericBid = parseFloat(bidAmount);

    if (isNaN(numericBid) || numericBid <= 0) {
      setFieldError("Please enter a valid bid amount.");
      return;
    }

    // Frontend validation vs current price
    if (numericBid <= auction.currentPrice) {
      setFieldError(`Your bid must be greater than the current bid of ${formatPrice(auction.currentPrice)}.`);
      return;
    }

    if (bids.length === 0 && numericBid < auction.startingPrice) {
      setFieldError(`Your bid must be at least the starting price of ${formatPrice(auction.startingPrice)}.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiService.placeBid(token, {
        auctionId: auction.id,
        amount: numericBid,
      });

      setSuccessMsg(`🎉 Bid of ${formatPrice(numericBid)} placed successfully!`);
      setBidAmount("");
      
      // Update local auction state
      const updatedPrice = res.currentPrice || numericBid;
      setAuction((prev) => ({
        ...prev,
        currentPrice: updatedPrice,
        bidCount: (prev.bidCount || bids.length) + 1,
      }));

      // Refresh bids history
      const bidsRes = await apiService.getAuctionBids(token, auction.id);
      setBids(bidsRes.bids || []);
    } catch (err) {
      setFieldError(err.message || "Unable to place your bid. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "3rem 1.5rem", maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto" }}></div>
        <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading auction details...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container" style={{ padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>{error || "Auction not found."}</span>
        </div>
        <Link to="/auctions" className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
          ← Back to Active Auctions
        </Link>
      </div>
    );
  }

  const imageUrl = auction.product?.imageUrl || (auction.images && auction.images[0]?.imageUrl) || "";
  const title = auction.title || auction.product?.name || "Untitled Auction";
  const description = auction.description || auction.product?.description || "No description provided.";
  const sellerName = auction.seller?.name || `Seller #${auction.sellerId}`;
  const totalBidsCount = auction.bidCount !== undefined ? auction.bidCount : bids.length;
  const isAuctionActive = auction.status?.toLowerCase() === "active" && !timeLeft.isExpired;

  return (
    <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "1150px", margin: "0 auto" }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          to="/auctions"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontWeight: "600",
          }}
        >
          ← Back to Auctions
        </Link>

        {/* Status Badge */}
        <span
          className="badge"
          style={{
            background: isAuctionActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: isAuctionActive ? "#34d399" : "#f87171",
            border: `1px solid ${isAuctionActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            padding: "0.3rem 0.8rem",
            fontSize: "0.8rem",
            fontWeight: "700",
            letterSpacing: "0.05em",
          }}
        >
          ● {isAuctionActive ? "ACTIVE AUCTION" : "AUCTION ENDED"}
        </span>
      </div>

      {/* Main Grid: Left (Product Info) & Right (Bidding Console) */}
      <div className="auction-detail-grid">
        {/* Left Column: Product Showcase */}
        <div className="auction-product-card">
          <div className="auction-main-image-wrapper">
            <img
              src={getImageSrc(imageUrl)}
              alt={title}
              className="auction-main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600x400?text=No+Auction+Image";
              }}
            />
          </div>

          <div style={{ padding: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.5rem" }}>
              {title}
            </h1>

            <div style={{ display: "flex", gap: "1rem", color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <span>👤 Seller: <strong style={{ color: "var(--text-main)" }}>{sellerName}</strong></span>
              <span>•</span>
              <span>📅 Listed: <strong>{formatDate(auction.startTime)}</strong></span>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--text-main)" }}>
                Item Description
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.925rem", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Bidding Console */}
        <div className="auction-bidding-card">
          {/* Live Timer Banner */}
          <div className="timer-box">
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: "600" }}>
              {timeLeft.isExpired ? "Auction Status" : "Time Remaining"}
            </span>
            <div className={`timer-display ${timeLeft.isExpired ? "expired" : ""}`}>
              ⏳ {timeLeft.formatted}
            </div>
            {!timeLeft.isExpired && (
              <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                Ends on: {formatDate(auction.endTime)}
              </span>
            )}
          </div>

          {/* Pricing Details Box */}
          <div className="price-prominent-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
                Current Highest Bid:
              </span>
              <span style={{ fontSize: "0.8rem", background: "var(--primary-light)", color: "#a5b4fc", padding: "0.15rem 0.55rem", borderRadius: "99px", fontWeight: "600" }}>
                {totalBidsCount} {totalBidsCount === 1 ? "bid" : "bids"}
              </span>
            </div>

            <div className="current-price-big">
              {formatPrice(auction.currentPrice)}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
              <span>Starting Price:</span>
              <strong style={{ color: "var(--text-muted)" }}>{formatPrice(auction.startingPrice)}</strong>
            </div>
          </div>

          {/* Bid Action Form or Restriction Alerts */}
          <div className="bidding-form-section">
            {isSeller ? (
              <div className="alert alert-warning" style={{ margin: 0, textAlign: "center", display: "block" }}>
                <p style={{ fontWeight: "700", marginBottom: "0.2rem" }}>⛔ Owner Restriction</p>
                <p style={{ fontSize: "0.85rem" }}>You cannot bid on your own auction.</p>
              </div>
            ) : !isAuctionActive ? (
              <div className="alert alert-error" style={{ margin: 0, textAlign: "center", display: "block" }}>
                <p style={{ fontWeight: "700", marginBottom: "0.2rem" }}>⌛ Auction Closed</p>
                <p style={{ fontSize: "0.85rem" }}>This auction has ended and is no longer accepting bids.</p>
              </div>
            ) : (
              <form onSubmit={handleBidSubmit}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--text-main)" }}>
                  Enter Your Bid Amount (₹):
                </label>

                <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: "700" }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min={auction.currentPrice + 1}
                      placeholder={`Enter > ${auction.currentPrice}`}
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setFieldError("");
                      }}
                      className="form-control"
                      style={{ paddingLeft: "2rem", width: "100%" }}
                      disabled={submitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ minWidth: "120px" }}
                  >
                    {submitting ? "Placing..." : "Place Bid"}
                  </button>
                </div>

                {/* Quick Bid Suggestion Button */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.ceil(auction.currentPrice + 100);
                      setBidAmount(next.toString());
                      setFieldError("");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-muted)",
                      borderRadius: "6px",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    +₹100 ({formatPrice(auction.currentPrice + 100)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.ceil(auction.currentPrice + 500);
                      setBidAmount(next.toString());
                      setFieldError("");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-muted)",
                      borderRadius: "6px",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    +₹500 ({formatPrice(auction.currentPrice + 500)})
                  </button>
                </div>

                {fieldError && (
                  <p style={{ color: "var(--error)", fontSize: "0.825rem", marginTop: "0.6rem", fontWeight: "600" }}>
                    ⚠️ {fieldError}
                  </p>
                )}

                {successMsg && (
                  <div className="alert alert-success" style={{ marginTop: "0.75rem", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
                    {successMsg}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Real Bid History Section */}
          <div className="bid-history-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                📜 Bid History ({bids.length})
              </h3>
              <button
                onClick={fetchData}
                style={{ background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", fontSize: "0.8rem" }}
              >
                🔄 Refresh
              </button>
            </div>

            {bids.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-dim)", fontSize: "0.85rem" }}>
                No bids placed yet. Be the first to bid!
              </div>
            ) : (
              <div className="bid-history-list">
                {bids.map((b, index) => {
                  const bidderName = b.user?.name || (b.userId === user?.id ? "You" : `Bidder #${b.userId}`);
                  const isTopBid = index === 0;

                  return (
                    <div key={b.id || index} className={`bid-history-item ${isTopBid ? "top-bid" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="bidder-avatar">👤</span>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "var(--text-main)" }}>
                            {bidderName} {b.userId === user?.id && <span style={{ fontSize: "0.7rem", color: "var(--primary)" }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                            {formatRelativeTime(b.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "800", fontSize: "1rem", color: isTopBid ? "var(--accent)" : "var(--text-main)" }}>
                          {formatPrice(b.amount)}
                        </div>
                        {isTopBid && (
                          <span style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: "700" }}>HIGHEST</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scoped CSS for Details Page */}
      <style>{`
        .auction-detail-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .auction-product-card {
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--bg-card-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .auction-main-image-wrapper {
          width: 100%;
          height: 360px;
          background-color: rgba(15, 23, 42, 0.8);
          overflow: hidden;
        }

        .auction-main-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .auction-bidding-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .timer-box {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
        }

        .timer-display {
          font-size: 1.5rem;
          font-weight: 800;
          color: #a5b4fc;
          letter-spacing: 0.03em;
          margin-top: 0.2rem;
        }

        .timer-display.expired {
          color: #f87171;
        }

        .price-prominent-box {
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .current-price-big {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--accent);
          text-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
          line-height: 1.1;
        }

        .bidding-form-section {
          background: var(--bg-card);
          border: 1px solid var(--bg-card-border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .bid-history-section {
          background: var(--bg-card);
          border: 1px solid var(--bg-card-border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .bid-history-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          max-height: 280px;
          overflow-y: auto;
        }

        .bid-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.85rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }

        .bid-history-item.top-bid {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.06);
        }

        .bidder-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }

        @media (max-width: 850px) {
          .auction-detail-grid {
            grid-template-columns: 1fr;
          }

          .auction-main-image-wrapper {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}

export default AuctionDetails;
