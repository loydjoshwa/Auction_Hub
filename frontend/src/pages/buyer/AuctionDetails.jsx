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
  const [endingAuction, setEndingAuction] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldError, setFieldError] = useState("");

  const [timeLeft, setTimeLeft] = useState({
    formatted: "",
    isExpired: false,
  });

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Fraud / Scam");
  const [otherReason, setOtherReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in to report an auction.");
      return;
    }

    const finalReason = reportReason === "Other" ? (otherReason.trim() || "Other") : reportReason;
    if (!finalReason) {
      setReportError("Please select or specify a reason.");
      return;
    }

    if (!reportDesc.trim()) {
      setReportError("Please enter a description for your report.");
      return;
    }

    try {
      setSubmittingReport(true);
      setReportError("");
      const res = await apiService.createReport(token, {
        auctionId: auction.id,
        reason: finalReason,
        description: reportDesc.trim(),
      });
      setReportSuccess(res.message || "🚩 Report submitted successfully. Thank you!");
      setReportModalOpen(false);
      setReportDesc("");
      setOtherReason("");
    } catch (err) {
      setReportError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleEndAuction = async () => {
    if (!window.confirm("Are you sure you want to end this auction now? Bidding will be closed immediately.")) {
      return;
    }
    setEndingAuction(true);
    setSuccessMsg("");
    setFieldError("");
    try {
      const res = await apiService.endAuction(token, auction.id);
      setSuccessMsg("🎉 Auction ended successfully!");
      if (res.auction) {
        setAuction(res.auction);
      } else {
        setAuction((prev) => ({ ...prev, status: "ended" }));
      }
      const bidsRes = await apiService.getAuctionBids(token, auction.id);
      setBids(bidsRes.bids || []);
    } catch (err) {
      setFieldError(err.message || "Failed to end auction.");
    } finally {
      setEndingAuction(false);
    }
  };

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

  const isAdmin = user?.role === "admin";
  const backToAuctionsPath = isAdmin ? "/admin/auctions" : "/auctions";

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
        <Link to={backToAuctionsPath} className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
          ← {isAdmin ? "Back to Manage Auctions" : "Back to Active Auctions"}
        </Link>
      </div>
    );
  }

  const imageUrl = auction.product?.imageUrl || (auction.images && auction.images[0]?.imageUrl) || "";
  const title = auction.title || auction.product?.name || "Untitled Auction";
  const description = auction.description || auction.product?.description || "No description provided.";
  const sellerName = auction.seller?.name || `Seller #${auction.sellerId}`;
  const totalBidsCount = auction.bidCount !== undefined ? auction.bidCount : bids.length;
  const isPaused = auction.status?.toLowerCase() === "paused";
  const isAuctionActive = auction.status?.toLowerCase() === "active" && !timeLeft.isExpired;

  return (
    <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "1150px", margin: "0 auto" }}>
      {reportSuccess && (
        <div className="alert alert-success" style={{ marginBottom: "1.25rem", justifyContent: "space-between" }}>
          <span>{reportSuccess}</span>
          <button onClick={() => setReportSuccess("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          to={backToAuctionsPath}
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* User Report Action */}
          {user && !isAdmin && (
            <button
              type="button"
              onClick={() => {
                setReportModalOpen(true);
                setReportError("");
              }}
              className="btn btn-secondary"
              style={{
                width: "auto",
                padding: "0.3rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#f87171",
                borderColor: "rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.08)",
              }}
            >
              🚩 Report
            </button>
          )}

          {/* Status Badge */}
          <span
            className="badge"
            style={{
              background: isPaused
                ? "rgba(245, 158, 11, 0.15)"
                : isAuctionActive
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
              color: isPaused ? "#fbbf24" : isAuctionActive ? "#34d399" : "#f87171",
              border: `1px solid ${
                isPaused
                  ? "rgba(245, 158, 11, 0.3)"
                  : isAuctionActive
                  ? "rgba(16, 185, 129, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
              padding: "0.3rem 0.8rem",
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            ● {isPaused ? "AUCTION PAUSED" : isAuctionActive ? "ACTIVE AUCTION" : "AUCTION ENDED"}
          </span>
        </div>
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
            {isPaused ? (
              <div className="alert alert-warning" style={{ margin: 0, textAlign: "center", display: "block" }}>
                <p style={{ fontWeight: "700", marginBottom: "0.3rem", fontSize: "1rem" }}>⏸️ Auction Paused</p>
                <p style={{ fontSize: "0.85rem", marginBottom: 0 }}>
                  {auction.pauseReason
                    ? `Reason: "${auction.pauseReason}"`
                    : "This auction is temporarily paused by administrator. New bids are disabled."}
                </p>
              </div>
            ) : isSeller ? (
              <div className="alert alert-warning" style={{ margin: 0, textAlign: "center", display: "block" }}>
                <p style={{ fontWeight: "700", marginBottom: "0.4rem" }}>⛔ Seller Controls</p>
                <p style={{ fontSize: "0.85rem", marginBottom: isAuctionActive ? "0.8rem" : "0" }}>
                  As the seller, you cannot bid on your own auction.
                </p>
                {isAuctionActive && (
                  <button
                    type="button"
                    onClick={handleEndAuction}
                    disabled={endingAuction}
                    className="btn btn-danger"
                    style={{ width: "100%", padding: "0.55rem 1rem", fontSize: "0.9rem" }}
                  >
                    {endingAuction ? "Ending Auction..." : "⏹️ End Auction Now"}
                  </button>
                )}
              </div>
            ) : !isAuctionActive ? (
              <div className="alert alert-error" style={{ margin: 0, textAlign: "center", display: "block" }}>
                <p style={{ fontWeight: "700", marginBottom: "0.2rem" }}>⌛ Auction Closed</p>
                <p style={{ fontSize: "0.85rem", marginBottom: bids.length > 0 ? "0.5rem" : 0 }}>
                  This auction has ended and is no longer accepting bids.
                </p>
                {bids.length > 0 && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "6px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <p style={{ fontWeight: "700", color: "#34d399", fontSize: "0.9rem", margin: 0 }}>
                      🏆 Winner: {bids[0].user?.name || (bids[0].userId === user?.id ? "You" : `Bidder #${bids[0].userId}`)} ({formatPrice(bids[0].amount)})
                    </p>
                    {bids[0].userId === user?.id && (
                      <p style={{ fontSize: "0.8rem", color: "#a7f3d0", margin: "0.25rem 0 0 0" }}>
                        🎉 Congratulations! You won this auction!
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleBidSubmit}>
                <div style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                      💰 Enter Bid Amount (₹):
                    </label>
                    <span style={{ fontSize: "0.78rem", color: "#a5b4fc", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: "600" }}>
                      Min: {formatPrice(auction.currentPrice + 1)}
                    </span>
                  </div>

                  <div style={{ position: "relative", width: "100%" }}>
                    <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#a5b4fc", fontWeight: "800", fontSize: "1.15rem", zIndex: 1 }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={auction.currentPrice + 0.01}
                      placeholder={`e.g. ${auction.currentPrice + 100}`}
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setFieldError("");
                      }}
                      className="form-control"
                      style={{
                        paddingLeft: "2.75rem",
                        paddingRight: "1rem",
                        width: "100%",
                        height: "48px",
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: "#ffffff",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: fieldError ? "1.5px solid #ef4444" : "1.5px solid rgba(99, 102, 241, 0.4)",
                        borderRadius: "10px",
                        boxSizing: "border-box",
                      }}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    height: "46px",
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    border: "none",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span>
                      <span>Placing Bid...</span>
                    </>
                  ) : (
                    <span>⚡ Place Bid</span>
                  )}
                </button>

                {fieldError && (
                  <p style={{ color: "#f87171", fontSize: "0.83rem", marginTop: "0.6rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    ⚠️ {fieldError}
                  </p>
                )}

                {successMsg && (
                  <div className="alert alert-success" style={{ marginTop: "0.75rem", padding: "0.65rem 0.85rem", fontSize: "0.85rem", borderRadius: "8px" }}>
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

      {/* Report Modal Popup */}
      {reportModalOpen && (
        <div className="modal-backdrop" onClick={() => setReportModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: "500px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Report Auction</h3>
            <p className="modal-body" style={{ marginBottom: "1rem" }}>
              Reporting auction: <strong>{title}</strong>
            </p>

            {reportError && (
              <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                <span>{reportError}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                  Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: "100%" }}
                  required
                >
                  <option value="Fraud / Scam">Fraud / Scam</option>
                  <option value="Misleading Information">Misleading Information</option>
                  <option value="Fake Product">Fake Product</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Suspicious Auction">Suspicious Auction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {reportReason === "Other" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                    Specify Reason <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State your reason..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                  Description / Details <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  placeholder="Please provide details about your report..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  style={{ width: "100%" }}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReportModalOpen(false)}
                  disabled={submittingReport}
                  style={{ width: "auto" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingReport}
                  style={{ width: "auto" }}
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuctionDetails;
