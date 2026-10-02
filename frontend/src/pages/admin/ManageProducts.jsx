import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageProducts() {
  const { token } = useAuth();
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inAuctionFilter, setInAuctionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  // Confirmation Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = useCallback(
    async (searchQuery, status, inAuction, sort) => {
      try {
        setLoading(true);
        setError("");
        const apiStatus = status === "all" ? "" : status;
        const apiInAuction = inAuction === "all" ? "" : inAuction;
        const res = await apiService.getAdminProducts(token, searchQuery, apiStatus, apiInAuction, sort);
        setProductsList(res.products || []);
      } catch (err) {
        setError(err.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchProducts(search, statusFilter, inAuctionFilter, sortOrder);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, inAuctionFilter, sortOrder, token, fetchProducts]);

  const openDeleteConfirmation = (product) => {
    setError("");
    setSuccessMessage("");
    setDeleteReason("");
    setReasonError("");
    setDeleteModal({
      isOpen: true,
      product,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteModal({
      isOpen: false,
      product: null,
    });
    setDeleteReason("");
    setReasonError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.product) return;

    if (!deleteReason.trim()) {
      setReasonError("Please provide a mandatory reason for deleting this product.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const res = await apiService.deleteAdminProduct(token, deleteModal.product.id, deleteReason.trim());
      setSuccessMessage(res.message || "Product deleted successfully");
      closeDeleteConfirmation();
      fetchProducts(search, statusFilter, inAuctionFilter, sortOrder);
    } catch (err) {
      setError(err.message || "Failed to delete product");
      closeDeleteConfirmation();
    } finally {
      setActionLoading(false);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "in auction") {
      return <span className="badge badge-seller">In Auction</span>;
    }
    if (s === "completed") {
      return <span className="badge badge-active-status">Completed</span>;
    }
    return <span className="badge badge-user">Ready for Auction</span>;
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="admin-page-container" style={{ maxWidth: "1240px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Manage Products</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            View, filter, and oversee user product listings across the platform
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

      {successMessage && (
        <div className="alert alert-success" style={{ justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
        </div>
      )}

      {/* Filter & Controls Bar */}
      <div className="users-filter-bar" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by product title or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={inAuctionFilter}
            onChange={(e) => setInAuctionFilter(e.target.value)}
          >
            <option value="all">Auction Filter: All</option>
            <option value="true">In Active Auction</option>
            <option value="false">Not In Auction</option>
          </select>

          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading product listings...</span>
        </div>
      ) : productsList.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No products found</h3>
          <p style={{ color: "var(--text-muted)" }}>No products match your search or filter options.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Product</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Seller</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Created Date</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsList.map((p) => {
                const img = p.imageUrl || "";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {img && (
                          <img
                            src={getImageSrc(img)}
                            alt={p.name}
                            style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", background: "rgba(15, 23, 42, 0.8)" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.925rem" }}>{p.name}</div>
                          {p.description && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{p.user?.name || "Seller"}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      {getStatusBadge(p.status)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {formatDate(p.createdAt)}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => openDeleteConfirmation(p)}
                        style={{ width: "auto", padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                      >
                        Delete Product
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Confirm Remove Product</h3>
            <p className="modal-body" style={{ marginBottom: "1rem" }}>
              Are you sure you want to remove product <strong>{deleteModal.product?.name}</strong>? Please provide a reason for this administrative action.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Reason for Removal <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                className="form-input"
                placeholder="Enter mandatory reason for removing product..."
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  if (e.target.value.trim()) setReasonError("");
                }}
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
              {reasonError && (
                <div style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                  {reasonError}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeDeleteConfirmation}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                {actionLoading ? "Removing..." : "Remove Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProducts;
