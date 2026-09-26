import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function Auctions() {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuctions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getAuctions(token);
      setAuctions(res.auctions || []);
    } catch (err) {
      setError(err.message || "Failed to load public auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAuctions();
    }
  }, [token]);

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatEndTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date - now;
    if (diffMs <= 0) return "Ended";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h left`;
    }
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m left`;
    }
    return `${diffMins}m left`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        /* Compact Responsive Auctions Grid */
        <div className="auctions-compact-grid">
          {auctions.map((auction) => {
            const imageUrl = auction.product?.imageUrl || (auction.images && auction.images[0]?.imageUrl) || "";
            const title = auction.title || auction.product?.name || "Untitled Auction";
            const description = auction.description || auction.product?.description || "No description available.";
            const sellerName = auction.seller?.name || `Seller #${auction.sellerId}`;

            return (
              <div key={auction.id} className="auction-card-compact">
                {/* Image Section with ACTIVE Badge Overlay */}
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
                  <span className="auction-active-badge">
                    ● {(auction.status || "ACTIVE").toUpperCase()}
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

                  {/* Pricing Box */}
                  <div className="auction-price-box">
                    <div className="price-row starting-price-row">
                      <span className="price-label">Starting Price:</span>
                      <span className="price-val starting-val">{formatPrice(auction.startingPrice)}</span>
                    </div>

                    <div className="price-row current-price-row">
                      <span className="price-label current-label">Current Price:</span>
                      <span className="price-val current-val">{formatPrice(auction.currentPrice)}</span>
                    </div>
                  </div>

                  {/* Metadata: Seller & Timer */}
                  <div className="auction-meta-box">
                    <div className="meta-item">
                      <span className="meta-icon">👤</span>
                      <span className="meta-text seller-name">{sellerName}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">⏳</span>
                      <span className="meta-text time-left" title={formatDate(auction.endTime)}>
                        {formatEndTime(auction.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    disabled
                    className="btn btn-secondary auction-action-btn"
                    title="Bidding functionality not enabled yet"
                  >
                    Bidding Not Enabled
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoped CSS for Compact Auction Cards & Grid */}
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
          height: 145px;
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
          transform: scale(1.05);
        }

        .auction-active-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: rgba(16, 185, 129, 0.25);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
          margin-bottom: 0.35rem;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .auction-card-short-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 0.85rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.3rem;
        }

        .auction-price-box {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.75rem;
          margin-bottom: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 0.78rem;
          color: var(--text-dim);
        }

        .starting-val {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .current-label {
          font-weight: 700;
          color: #a5b4fc;
        }

        .current-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--accent);
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }

        .auction-meta-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.4rem;
          margin-bottom: 0.85rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .seller-name {
          color: var(--text-muted);
          font-weight: 600;
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .time-left {
          color: #f87171;
          font-weight: 700;
        }

        .auction-action-btn {
          width: 100%;
          padding: 0.45rem 0.75rem !important;
          font-size: 0.825rem !important;
          opacity: 0.65;
          cursor: not-allowed;
          margin-top: auto;
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
