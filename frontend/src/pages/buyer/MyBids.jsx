import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function MyBids() {
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyBids = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getMyBids(token);
      setBids(res.bids || []);
    } catch (err) {
      setError(err.message || "Failed to load your bidding history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchMyBids();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getStatusBadge = (item) => {
    const status = (item.userStatus || "").toLowerCase();
    const isEnded = item.auctionStatus?.toLowerCase() === "ended" || new Date(item.endTime) <= new Date();

    if (!isEnded) {
      if (status === "highest" || status === "highest bid") {
        return (
          <span className="badge badge-success" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            🏆 Highest Bid
          </span>
        );
      }
      return (
        <span className="badge badge-warning" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          ⚠️ Outbid
        </span>
      );
    } else {
      if (status === "won") {
        return (
          <span className="badge badge-success" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.3))", color: "#6ee7b7", border: "1px solid #10b981" }}>
            🎉 Won
          </span>
        );
      }
      if (status === "lost") {
        return (
          <span className="badge badge-danger" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            ❌ Lost
          </span>
        );
      }
      return (
        <span className="badge" style={{ background: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", border: "1px solid rgba(148, 163, 184, 0.3)" }}>
          ⌛ Ended
        </span>
      );
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800" }}>
          My Bids
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
          Track all auctions you have participated in
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
          <p style={{ color: "var(--text-muted)" }}>Loading your bids...</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔨</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>No Bids Placed Yet</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
            Explore active auctions, place your bids, and track your win status here.
          </p>
          <Link to="/auctions" className="btn btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Browse Active Auctions
          </Link>
        </div>
      ) : (
        /* Professional Table / List Layout */
        <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--bg-card-border)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.925rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Product / Auction</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>My Latest Bid</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Current / Final Price</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((item) => {
                  const imageUrl = item.product?.imageUrl || "";

                  return (
                    <tr
                      key={item.auctionId}
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
                      {/* Product Name & Image */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}
                          onClick={() => navigate(`/auctions/${item.auctionId}`)}
                        >
                          {imageUrl && (
                            <img
                              src={getImageSrc(imageUrl)}
                              alt={item.title}
                              style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover", background: "rgba(15, 23, 42, 0.8)" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                              Auction #{item.auctionId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* My Bid */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: "700", color: "#a5b4fc" }}>
                        {formatPrice(item.myHighestBid)}
                      </td>

                      {/* Current / Final Price */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: "800", color: "var(--accent)" }}>
                        {formatPrice(item.currentPrice)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {getStatusBadge(item)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <button
                          onClick={() => navigate(`/auctions/${item.auctionId}`)}
                          className="btn btn-secondary"
                          style={{ padding: "0.4rem 0.9rem", fontSize: "0.825rem", width: "auto" }}
                        >
                          View
                        </button>
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

export default MyBids;
