import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  // Selected Report Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [statusErr, setStatusErr] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Pause / Resume Modal from Report View
  const [pauseModal, setPauseModal] = useState({ isOpen: false, auction: null, action: "pause" });
  const [pauseReason, setPauseReason] = useState("");
  const [pauseErr, setPauseErr] = useState("");

  const fetchReports = useCallback(
    async (searchQuery, status, sort) => {
      try {
        setLoading(true);
        setError("");
        const apiStatus = status === "all" ? "" : status;
        const res = await apiService.getAdminReports(token, searchQuery, apiStatus, sort);
        setReports(res.reports || []);
      } catch (err) {
        setError(err.message || "Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchReports(search, statusFilter, sortOrder);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOrder, token, fetchReports]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    if (!statusNote.trim()) {
      setStatusErr("Please provide a reason or note for this status update.");
      return;
    }

    try {
      setActionLoading(true);
      setStatusErr("");
      const res = await apiService.updateAdminReportStatus(token, selectedReport.id, newStatus, statusNote.trim());
      setSuccessMessage(res.message || `Report status updated to ${newStatus}`);
      setSelectedReport(res.report || null);
      setStatusNote("");
      fetchReports(search, statusFilter, sortOrder);
    } catch (err) {
      setStatusErr(err.message || "Failed to update report status");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseResumeAuction = async (e) => {
    e.preventDefault();
    if (!pauseModal.auction) return;
    if (!pauseReason.trim()) {
      setPauseErr("A reason is mandatory for this action.");
      return;
    }

    try {
      setActionLoading(true);
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

      // Refresh report details if open
      if (selectedReport) {
        const repRes = await apiService.getAdminReportById(token, selectedReport.id);
        if (repRes.report) setSelectedReport(repRes.report);
      }
      fetchReports(search, statusFilter, sortOrder);
    } catch (err) {
      setPauseErr(err.message || "Failed to perform action.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") {
      return { background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" };
    }
    if (s === "reviewing") {
      return { background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)" };
    }
    if (s === "resolved") {
      return { background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" };
    }
    return { background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" };
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
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Manage Reports</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Review user-submitted reports regarding suspicious auctions, fraud, or violations
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
            placeholder="Search by reason, description, reporter, or auction title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button className={`filter-btn ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
            All Reports
          </button>
          <button className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`} onClick={() => setStatusFilter("pending")}>
            Pending
          </button>
          <button className={`filter-btn ${statusFilter === "reviewing" ? "active" : ""}`} onClick={() => setStatusFilter("reviewing")}>
            Reviewing
          </button>
          <button className={`filter-btn ${statusFilter === "resolved" ? "active" : ""}`} onClick={() => setStatusFilter("resolved")}>
            Resolved
          </button>
          <button className={`filter-btn ${statusFilter === "rejected" ? "active" : ""}`} onClick={() => setStatusFilter("rejected")}>
            Rejected
          </button>

          <select
            className="form-input"
            style={{ width: "auto", padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading user reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: "center", padding: "3.5rem 2rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>No reports found</h3>
          <p style={{ color: "var(--text-muted)" }}>No user reports match your current filter selection.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Reported Auction</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Reporter</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Reason</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>Date</th>
                <th style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.925rem" }}>
                      {rep.auction?.title || `Auction #${rep.auctionId}`}
                    </div>
                    {rep.auction?.seller && (
                      <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        Seller: {rep.auction.seller.name}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                      {rep.reporter?.name || `User #${rep.reporterId}`}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                      {rep.reporter?.email || ""}
                    </div>
                  </td>

                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ fontWeight: "700", color: "var(--text-main)" }}>{rep.reason}</span>
                    {rep.description && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {rep.description}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span className="badge" style={getStatusBadgeStyle(rep.status)}>
                      ● {rep.status.toUpperCase()}
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 1rem", fontSize: "0.825rem", color: "var(--text-dim)" }}>
                    {formatDate(rep.createdAt)}
                  </td>

                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedReport(rep);
                        setStatusNote(rep.adminReason || "");
                        setStatusErr("");
                      }}
                      style={{ width: "auto", padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "620px", width: "100%", padding: "1.75rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--bg-card-border)", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                🚩 Report #{selectedReport.id} Details
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.4rem" }}
              >
                &times;
              </button>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.025)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--bg-card-border)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Reported Auction</div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.2rem" }}>
                  {selectedReport.auction?.title || `Auction #${selectedReport.auctionId}`}
                </div>
                {selectedReport.auction && (
                  <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "flex", gap: "1rem" }}>
                    <span>Status: <strong style={{ color: selectedReport.auction.status === "paused" ? "#fbbf24" : "#34d399" }}>{selectedReport.auction.status.toUpperCase()}</strong></span>
                    <span>Current Price: <strong>₹{selectedReport.auction.currentPrice}</strong></span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.025)", padding: "0.85rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--bg-card-border)" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Reporter</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.2rem" }}>
                    {selectedReport.reporter?.name || "N/A"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                    {selectedReport.reporter?.email}
                  </div>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.025)", padding: "0.85rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--bg-card-border)" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Seller / Owner</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.2rem" }}>
                    {selectedReport.auction?.seller?.name || "N/A"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                    {selectedReport.auction?.seller?.email}
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.025)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--bg-card-border)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Reason & Description</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#f87171", marginTop: "0.2rem" }}>
                  {selectedReport.reason}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-main)", marginTop: "0.4rem", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                  {selectedReport.description}
                </div>
              </div>
            </div>

            {/* Auction Action: Pause / Resume directly from Report */}
            {selectedReport.auction && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)" }}>
                      Auction Controls
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Status: <strong style={{ textTransform: "uppercase", color: selectedReport.auction.status === "paused" ? "#fbbf24" : "#34d399" }}>{selectedReport.auction.status}</strong>
                    </div>
                  </div>

                  {selectedReport.auction.status === "active" ? (
                    <button
                      type="button"
                      className="btn btn-warning"
                      style={{ width: "auto", padding: "0.4rem 0.9rem", fontSize: "0.85rem", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}
                      onClick={() => setPauseModal({ isOpen: true, auction: selectedReport.auction, action: "pause" })}
                    >
                      ⏸ Pause Auction
                    </button>
                  ) : selectedReport.auction.status === "paused" ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "auto", padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                      onClick={() => setPauseModal({ isOpen: true, auction: selectedReport.auction, action: "resume" })}
                    >
                      ▶ Resume Auction
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Admin Status Action Form */}
            <div style={{ borderTop: "1px solid var(--bg-card-border)", paddingTop: "1.25rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.75rem" }}>
                Update Report Status
              </h4>

              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                  Admin Reason / Note <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Enter required reason or note for this decision..."
                  value={statusNote}
                  onChange={(e) => {
                    setStatusNote(e.target.value);
                    if (e.target.value.trim()) setStatusErr("");
                  }}
                  style={{ width: "100%", resize: "vertical" }}
                  disabled={actionLoading}
                />
              </div>

              {statusErr && (
                <div style={{ color: "#f87171", fontSize: "0.825rem", marginBottom: "0.85rem" }}>
                  ⚠️ {statusErr}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus("reviewing")}
                  className="btn btn-secondary"
                  style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  Mark Reviewing
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus("rejected")}
                  className="btn btn-danger"
                  style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                >
                  Reject Report
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus("resolved")}
                  className="btn btn-primary"
                  style={{ width: "auto", padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}
                >
                  Resolve Report
                </button>
              </div>
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
                ? `You are about to pause auction "${pauseModal.auction?.title}". Bidding will be temporarily disabled and the auction timer will freeze.`
                : `You are about to resume auction "${pauseModal.auction?.title}". Bidding will reactivate and the remaining time will continue.`}
            </p>

            <form onSubmit={handlePauseResumeAuction}>
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

export default ManageReports;
