import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageAuctions() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [auctionsList, setAuctionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  // Confirmation Modal
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    auction: null,
  });

  // Pause/Resume Modal
  const [pauseModal, setPauseModal] = useState({
    isOpen: false,
    auction: null,
    action: "pause",
  });
  const [pauseReason, setPauseReason] = useState("");
  const [pauseErr, setPauseErr] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const fetchAuctions = useCallback(
    async (searchQuery, status, sort) => {
      try {
        setLoading(true);
        setError("");
        const apiStatus = status === "all" ? "" : status;
        const res = await apiService.getAdminAuctions(token, searchQuery, apiStatus, sort);
        setAuctionsList(res.auctions || []);
      } catch (err) {
        setError(err.message || "Failed to fetch auctions");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchAuctions(search, statusFilter, sortOrder);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOrder, token, fetchAuctions]);

  const openCancelConfirmation = (auction) => {
    setError("");
    setSuccessMessage("");
    setCancelModal({
      isOpen: true,
      auction,
    });
  };

  const closeCancelConfirmation = () => {
    setCancelModal({
      isOpen: false,
      auction: null,
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.auction) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const res = await apiService.cancelAdminAuction(token, cancelModal.auction.id);
      setSuccessMessage(res.message || "Auction cancelled successfully");
      closeCancelConfirmation();
      fetchAuctions(search, statusFilter, sortOrder);
    } catch (err) {
      setError(err.message || "Failed to cancel auction");
      closeCancelConfirmation();
    } finally {
      setActionLoading(false);
    }
  };

  const openPauseModal = (auction, action) => {
    setError("");
    setSuccessMessage("");
    setPauseReason("");
    setPauseErr("");
    setPauseModal({
      isOpen: true,
      auction,
      action,
    });
  };

  const handleConfirmPauseResume = async (e) => {
    e.preventDefault();
    if (!pauseModal.auction) return;
    if (!pauseReason.trim()) {
      setPauseErr("A reason is mandatory for this action.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");
      setPauseErr("");

      let res;
      if (pauseModal.action === "pause") {
        res = await apiService.pauseAdminAuction(token, pauseModal.auction.id, pauseReason.trim());
        setSuccessMessage(res.message || "Auction paused successfully.");
      } else {
        res = await apiService.resumeAdminAuction(token, pauseModal.auction.id, pauseReason.trim());
        setSuccessMessage(res.message || "Auction resumed successfully.");
      }
      setPauseModal({ isOpen: false, auction: null, action: "pause" });
      setPauseReason("");
      fetchAuctions(search, statusFilter, sortOrder);
    } catch (err) {
      setError(err.message || "Failed to update auction status");
      setPauseModal({ isOpen: false, auction: null, action: "pause" });
      setPauseReason("");
    } finally {
      setActionLoading(false);
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
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Manage Auctions</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Monitor active, paused, and completed auction listings across the platform
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
            placeholder="Search by title, product, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Auctions
          </button>
          <button
            className={`filter-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>
          <button
            className={`filter-btn ${statusFilter === "paused" ? "active" : ""}`}
            onClick={() => setStatusFilter("paused")}
          >
            Paused
          </button>
          <button
            className={`filter-btn ${statusFilter === "completed" ? "active" : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </button>

          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="price_high">Price: High to Low</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading auction data...</span>
        </div>
      ) : auctionsList.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No auctions found</h3>
          <p style={{ color: "var(--text-muted)" }}>No auction listings match your search or filter selection.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Auction / Product</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Seller</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Starting / Current Price</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Winner / End Time</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctionsList.map((item) => {
                const auc = item.auction || item;
                const title = auc.title || auc.product?.name || "Auction Item";
                const img = auc.product?.imageUrl || "";
                const statusLower = (auc.status || "").toLowerCase();
                const isPaused = statusLower === "paused";
                const isEnded = statusLower === "completed" || (statusLower === "active" && new Date(auc.endTime) <= new Date());

                return (
                  <tr key={auc.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
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
                          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                            {auc.bidCount || 0} bids placed
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{auc.seller?.name || "Seller"}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Start: {formatPrice(auc.startingPrice)}</div>
                      <div style={{ fontWeight: "800", color: "var(--accent)", fontSize: "0.95rem" }}>Current: {formatPrice(auc.currentPrice)}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          background: isPaused
                            ? "rgba(245, 158, 11, 0.15)"
                            : !isEnded
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                          color: isPaused ? "#fbbf24" : !isEnded ? "#34d399" : "#f87171",
                          border: `1px solid ${
                            isPaused
                              ? "rgba(245, 158, 11, 0.3)"
                              : !isEnded
                              ? "rgba(16, 185, 129, 0.3)"
                              : "rgba(239, 68, 68, 0.3)"
                          }`,
                        }}
                      >
                        ● {isPaused ? "Paused" : !isEnded ? "Active" : "Completed"}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      {item.winner ? (
                        <div>
                          <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: "700" }}>🏆 Winner: </span>
                          <strong style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>{item.winner.name}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                          Ends: {formatDate(auc.endTime)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {!isEnded && !isPaused && (
                          <>
                            <button
                              className="btn btn-warning"
                              onClick={() => openPauseModal(auc, "pause")}
                              style={{ width: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}
                            >
                              Pause
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => openCancelConfirmation(auc)}
                              style={{ width: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                            >
                              End Auction
                            </button>
                          </>
                        )}
                        {isPaused && (
                          <button
                            className="btn btn-primary"
                            onClick={() => openPauseModal(auc, "resume")}
                            style={{ width: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                          >
                            Resume
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigate(`/auctions/${auc.id}`)}
                          style={{ width: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* End Auction Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Confirm End Auction</h3>
            <p className="modal-body">
              Are you sure you want to end auction <strong>{cancelModal.auction?.title}</strong> now? Bidding will close immediately and highest bidder will win.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeCancelConfirmation}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                {actionLoading ? "Ending..." : "End Auction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause / Resume Confirmation Modal */}
      {pauseModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "500px", width: "100%" }}>
            <h3 className="modal-title">
              {pauseModal.action === "pause" ? "Confirm Pause Auction" : "Confirm Resume Auction"}
            </h3>
            <p className="modal-body">
              {pauseModal.action === "pause"
                ? `You are about to pause auction "${pauseModal.auction?.title}". Bidding will be temporarily disabled and auction timer will freeze.`
                : `You are about to resume auction "${pauseModal.auction?.title}". Bidding will reactivate and remaining time will continue.`}
            </p>

            <form onSubmit={handleConfirmPauseResume}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                  Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder={pauseModal.action === "pause" ? "Enter mandatory reason for pausing..." : "Enter mandatory reason for resuming..."}
                  value={pauseReason}
                  onChange={(e) => {
                    setPauseReason(e.target.value);
                    if (e.target.value.trim()) setPauseErr("");
                  }}
                  style={{ width: "100%" }}
                  required
                />
                {pauseErr && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.35rem" }}>{pauseErr}</p>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setPauseModal({ isOpen: false, auction: null, action: "pause" });
                    setPauseReason("");
                    setPauseErr("");
                  }}
                  disabled={actionLoading}
                  style={{ width: "auto" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={pauseModal.action === "pause" ? "btn btn-danger" : "btn btn-primary"}
                  disabled={actionLoading}
                  style={{ width: "auto" }}
                >
                  {actionLoading
                    ? "Processing..."
                    : pauseModal.action === "pause"
                    ? "Pause Auction"
                    : "Resume Auction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAuctions;
