import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageBids() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bidsList, setBidsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");

  const fetchBids = useCallback(
    async (searchQuery, sort) => {
      try {
        setLoading(true);
        setError("");
        const res = await apiService.getAdminBids(token, searchQuery, "", "", sort);
        setBidsList(res.bids || []);
      } catch (err) {
        setError(err.message || "Failed to fetch bids");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchBids(search, sortOrder);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sortOrder, token, fetchBids]);

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "1240px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Manage Bids</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Monitor all user bidding activity across platform auctions
          </p>
        </div>
        <div className="admin-nav-actions">
          <Link to="/admin" className="btn btn-secondary" style={{ width: "auto" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
        </div>
      )}

      {/* Filter & Controls Bar */}
      <div className="users-filter-bar" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by bidder name, auction title, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Sort: Latest Bids First</option>
            <option value="oldest">Sort: Oldest Bids First</option>
            <option value="highest">Amount: Highest First</option>
            <option value="lowest">Amount: Lowest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading bid history...</span>
        </div>
      ) : bidsList.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No bids found</h3>
          <p style={{ color: "var(--text-muted)" }}>No bid records match your search criteria.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Auction / Product</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Bidder</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Bid Amount</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Bid Status</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Date & Time</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bidsList.map((item) => {
                const bid = item;
                const title = bid.auction?.title || bid.auction?.product?.name || "Auction Item";
                const img = bid.auction?.product?.imageUrl || "";

                return (
                  <tr key={bid.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {img && (
                          <img
                            src={getImageSrc(img)}
                            alt={title}
                            style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", background: "rgba(15, 23, 42, 0.8)" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.925rem" }}>{title}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{bid.user?.name || "Bidder"}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem", fontWeight: "800", color: "var(--accent)", fontSize: "0.95rem" }}>
                      {formatPrice(bid.amount)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      {item.isHighest ? (
                        <span className="badge badge-success" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                          ★ Highest Bid
                        </span>
                      ) : (
                        <span className="badge" style={{ background: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1" }}>
                          Outbid
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {formatDate(bid.createdAt)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                        style={{ width: "auto", padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                      >
                        View Auction
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageBids;
