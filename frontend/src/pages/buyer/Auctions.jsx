import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function Auctions() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const fetchAuctions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getAuctions(token);
      setAuctions(res.auctions || []);
    } catch (err) {
      setError(err.message || "Failed to load active auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAuctions();
    }
  }, [token]);

  // Update timer every second for card countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const getRemainingTime = (dateStr) => {
    if (!dateStr) return { text: "No limit", isExpired: false };
    const end = new Date(dateStr).getTime();
    const diff = end - now;

    if (diff <= 0) return { text: "Auction Ended", isExpired: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return { text: `Ends in ${days}d ${hours % 24}h`, isExpired: false };
    }
    if (hours > 0) {
      return { text: `Ends in ${hours}h ${mins}m`, isExpired: false };
    }
    return { text: `Ends in ${mins}m ${secs}s`, isExpired: false };
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 className="page-title" style={{ fontSize: "1.85rem", fontWeight: "800", margin: 0 }}>
              Active Auctions
            </h1>
            <span
              className="badge"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "0.2rem 0.6rem",
                fontSize: "0.75rem",
              }}
            >
              Live Marketplace
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
            Browse active auctions and discover items from sellers across the platform
          </p>
        </div>

        <button
          onClick={fetchAuctions}
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner" style={{ width: "28px", height: "28px", margin: "0 auto" }}></div>
          <p style={{ color: "var(--text-muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>Loading active auctions...</p>
        </div>
      ) : auctions.length === 0 ? (
        /* Empty State */
        <div className="empty-state-card" style={{ padding: "3rem 1.5rem" }}>
          <div className="empty-state-icon" style={{ fontSize: "2.8rem" }}>🔨</div>
          <h2 className="empty-state-title" style={{ fontSize: "1.35rem" }}>No Active Auctions</h2>
          <p className="empty-state-desc" style={{ fontSize: "0.9rem" }}>
            There are currently no active auctions available. Check back soon or list your product in an auction!
          </p>
        </div>
      ) : (
        /* Professional Compact Auction Grid */
        <div className="auctions-compact-grid">
          {auctions.map((auction) => {
            const imageUrl = auction.product?.imageUrl || (auction.images && auction.images[0]?.imageUrl) || "";
            const title = auction.title || auction.product?.name || "Untitled Auction";
            const description = auction.description || auction.product?.description || "No description available.";
            const bidCount = auction.bidCount !== undefined ? auction.bidCount : 0;
            const remaining = getRemainingTime(auction.endTime);
            const isEnded = remaining.isExpired || auction.status?.toLowerCase() !== "active";

            return (
              <div key={auction.id} className="auction-card-compact">
                {/* Image Section with Status Badge Overlay */}
                <div className="auction-card-thumb-wrapper">
                  <img
                    src={getImageSrc(imageUrl)}
                    alt={title}
                    className="auction-card-thumb"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x180?text=No+Auction+Image";
                    }}
                  />
                  <span className={`auction-status-badge ${isEnded ? "ended" : "active"}`}>
                    ● {isEnded ? "ENDED" : "ACTIVE"}
                  </span>
                </div>

                {/* Card Main Body */}
                <div className="auction-card-body">
                  <h3 className="auction-card-name" title={title}>
                    {title}
                  </h3>
                  <p className="auction-card-short-desc" title={description}>
                    {description}
                  </p>

                  {/* Prominent Current Bid Box */}
                  <div className="auction-price-box">
                    <div className="price-row">
                      <span className="current-label">Current Bid</span>
                      <span className="bids-count-badge">{bidCount} {bidCount === 1 ? "bid" : "bids"}</span>
                    </div>

                    <div className="current-val-prominent">
                      {formatPrice(auction.currentPrice)}
                    </div>

                    {auction.startingPrice && auction.startingPrice !== auction.currentPrice && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                        Starting Price: {formatPrice(auction.startingPrice)}
                      </div>
                    )}
                  </div>

                  {/* Timer & Meta Info */}
                  <div className="auction-meta-box">
                    <div className="meta-item">
                      <span className="meta-icon">⏳</span>
                      <span className={`meta-text ${isEnded ? "time-ended" : "time-active"}`}>
                        {remaining.text}
                      </span>
                    </div>
                  </div>

                  {/* CTA Action Button */}
                  <button
                    onClick={() => navigate(`/auctions/${auction.id}`)}
                    className="btn btn-primary auction-action-btn"
                  >
                    View & Bid →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoped CSS for Professional Auction Cards */}
      <style>{`
        .auctions-compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .auction-card-compact {
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--bg-card-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }

        .auction-card-compact:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.45);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .auction-card-thumb-wrapper {
          position: relative;
          width: 100%;
          height: 160px;
          background-color: rgba(15, 23, 42, 0.7);
          overflow: hidden;
        }

        .auction-card-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .auction-card-compact:hover .auction-card-thumb {
          transform: scale(1.04);
        }

        .auction-status-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .auction-status-badge.active {
          background: rgba(16, 185, 129, 0.25);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.45);
        }

        .auction-status-badge.ended {
          background: rgba(239, 68, 68, 0.25);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.45);
        }

        .auction-card-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .auction-card-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.3rem;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .auction-card-short-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.3rem;
        }

        .auction-price-box {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.65rem 0.85rem;
          margin-bottom: 0.75rem;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .current-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .bids-count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #a5b4fc;
          background: var(--primary-light);
          padding: 0.1rem 0.5rem;
          border-radius: 99px;
        }

        .current-val-prominent {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--accent);
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
          margin-top: 0.15rem;
        }

        .auction-meta-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.3rem;
          margin-bottom: 0.85rem;
          font-size: 0.825rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .time-active {
          color: #f87171;
          font-weight: 700;
        }

        .time-ended {
          color: var(--text-dim);
          font-weight: 600;
        }

        .auction-action-btn {
          width: 100%;
          padding: 0.5rem 0.75rem !important;
          font-size: 0.85rem !important;
          margin-top: auto;
          font-weight: 700 !important;
        }

        @media (max-width: 900px) {
          .auctions-compact-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 600px) {
          .auctions-compact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Auctions;
