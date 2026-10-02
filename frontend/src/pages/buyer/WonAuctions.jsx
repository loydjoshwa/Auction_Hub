import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function WonAuctions() {
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWonAuctions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getUserOrders(token);
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message || "Failed to load won auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchWonAuctions();
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

  const getOrderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending address":
        return (
          <span className="badge badge-warning" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
             Address Pending
          </span>
        );
      case "address added":
        return (
          <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
            📍 Address Added
          </span>
        );
      case "packed":
        return (
          <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            📦 Packed
          </span>
        );
      case "shipped":
        return (
          <span className="badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
            🚚 Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="badge badge-success" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            ✅ Delivered
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1" }}>
            {status || "Pending"}
          </span>
        );
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800" }}>
          Won Auctions
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
          Manage delivery addresses and track orders for your won items
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
          <p style={{ color: "var(--text-muted)" }}>Loading your won auctions...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏆</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>No Won Auctions Yet</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
            Auctions you win will appear here. Keep placing bids on active auctions!
          </p>
          <Link to="/auctions" className="btn btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Explore Active Auctions
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--bg-card-border)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.925rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Product</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Winning Bid</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700" }}>Order Status</th>
                  <th style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: "700", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const title = ord.auction?.title || ord.auction?.product?.name || "Won Product";
                  const imageUrl = ord.auction?.product?.imageUrl || "";

                  return (
                    <tr
                      key={ord.id}
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
                          onClick={() => navigate(`/orders/${ord.id}`)}
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
                              
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Winning Bid */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: "800", color: "var(--accent)" }}>
                        {formatPrice(ord.finalAmount)}
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        {getOrderStatusBadge(ord.status)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <button
                          onClick={() => navigate(`/orders/${ord.id}`)}
                          className="btn btn-primary"
                          style={{ padding: "0.4rem 0.9rem", fontSize: "0.825rem", width: "auto" }}
                        >
                          View Order
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

export default WonAuctions;
