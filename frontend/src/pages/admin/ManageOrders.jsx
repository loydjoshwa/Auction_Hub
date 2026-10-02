import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageOrders() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const fetchOrders = useCallback(
    async (searchQuery, status, sort) => {
      try {
        setLoading(true);
        setError("");
        const apiStatus = status === "all" ? "" : status;
        const res = await apiService.getAdminOrders(token, searchQuery, apiStatus, sort);
        setOrdersList(res.orders || []);
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchOrders(search, statusFilter, sortOrder);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOrder, token, fetchOrders]);

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

  const getOrderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "confirmed":
        return (
          <span className="badge badge-success" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            Confirmed
          </span>
        );
      case "pending address":
        return (
          <span className="badge badge-warning" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            Address Pending
          </span>
        );
      case "address added":
        return (
          <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
            Address Added
          </span>
        );
      case "packed":
        return (
          <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            Packed
          </span>
        );
      case "shipped":
        return (
          <span className="badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="badge badge-success" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            Delivered
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1" }}>
            {status || "Confirmed"}
          </span>
        );
    }
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "1240px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Manage Orders</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Overview of all completed auction orders and fulfillment statuses
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
            placeholder="Search by product, buyer, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending address">Pending Address</option>
            <option value="address added">Address Added</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount_high">Price: High to Low</option>
            <option value="amount_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading order records...</span>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No orders found</h3>
          <p style={{ color: "var(--text-muted)" }}>No orders match your search or filter selection.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Product</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Seller</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Buyer</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Winning Price</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Order Status</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Date</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map((ord) => {
                const title = ord.auction?.title || ord.auction?.product?.name || "Product Item";
                const img = ord.auction?.product?.imageUrl || "";

                return (
                  <tr key={ord.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
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
                      <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{ord.seller?.name || "Seller"}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{ord.buyer?.name || "Buyer"}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem", fontWeight: "800", color: "var(--accent)", fontSize: "0.95rem" }}>
                      {formatPrice(ord.finalAmount)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      {getOrderStatusBadge(ord.status)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {formatDate(ord.createdAt)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/orders/${ord.id}`)}
                        style={{ width: "auto", padding: "0.35rem 0.8rem", fontSize: "0.825rem" }}
                      >
                        View Details
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

export default ManageOrders;
