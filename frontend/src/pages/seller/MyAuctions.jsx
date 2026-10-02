import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function MyAuctions() {
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [endingId, setEndingId] = useState(null);

  const fetchMyAuctions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getMyAuctions(token);
      setAuctions(res.auctions || []);
    } catch (err) {
      setError(err.message || "Failed to load your auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchMyAuctions();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  const handleEndAuction = async (auctionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to end this auction now? Bidding will close immediately and the highest bidder will win.")) {
      return;
    }
    setEndingId(auctionId);
    try {
      await apiService.endAuction(token, auctionId);
      fetchMyAuctions();
    } catch (err) {
      alert(err.message || "Failed to end auction.");
    } finally {
      setEndingId(null);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800" }}>
          My Auctions
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
          Manage auctions created for your products
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div className="spinner" style={{ width: "36px", height: "36px", margin: "0 auto 1rem auto" }}></div>
          <p style={{ color: "var(--text-muted)" }}>Loading your auctions...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏷️</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>No Auctions Created Yet</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
            Add products and place them in auction to start selling items.
          </p>
          <Link to="/products" className="btn btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Go to My Products
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--bg-card-border)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.925rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Product / Auction</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Starting Price</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Current Price</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auc) => {
                  const title = auc.title || auc.product?.name || "Untitled Auction";
                  const imageUrl = auc.product?.imageUrl || "";
                  const isActive = auc.status?.toLowerCase() === "active" && new Date(auc.endTime) > new Date();

                  return (
                    <tr
                      key={auc.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Product */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}
                          onClick={() => navigate(`/auctions/${auc.id}`)}
                        >
                          {imageUrl && (
                            <img
                              src={getImageSrc(imageUrl)}
                              alt={title}
                              style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", background: "rgba(15, 23, 42, 0.8)" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {title}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                              Auction #{auc.id} • {auc.bidCount || 0} bids
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Starting Price */}
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)" }}>
                        {formatPrice(auc.startingPrice)}
                      </td>

                      {/* Current Price */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: "800", color: "var(--accent)" }}>
                        {formatPrice(auc.currentPrice)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span
                          className="badge"
                          style={{
                            background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: isActive ? "#34d399" : "#f87171",
                            border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                          }}
                        >
                          ● {isActive ? "Active" : "Completed"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          {isActive && (
                            <button
                              onClick={(e) => handleEndAuction(auc.id, e)}
                              disabled={endingId === auc.id}
                              className="btn btn-danger btn-sm"
                              style={{ width: "auto" }}
                            >
                              {endingId === auc.id ? "Ending..." : "End Auction"}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/auctions/${auc.id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ width: "auto" }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAuctions;
