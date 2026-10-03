import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function MyReports() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);

  const fetchMyReports = async () => {
    if (!token) {
      logout();
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiService.getMyReports(token);
      setReports(res.reports || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate("/login");
        return;
      }
      setError(err.message || "Unable to load your reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [token]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "reviewing":
        return (
          <span
            className="badge"
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "700",
            }}
          >
            🔵 Reviewing
          </span>
        );
      case "resolved":
        return (
          <span
            className="badge"
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "700",
            }}
          >
            🟢 Resolved
          </span>
        );
      case "rejected":
        return (
          <span
            className="badge"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "700",
            }}
          >
            🔴 Rejected
          </span>
        );
      default:
        return (
          <span
            className="badge"
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "700",
            }}
          >
            🟡 Pending
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          to="/profile"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          ← Back to Profile
        </Link>
        <button
          onClick={fetchMyReports}
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.4rem" }}>
          🚩 My Submitted Reports
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
          View the status and administration feedback for items you reported.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="card" style={{ padding: "3rem 0", textAlign: "center" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 1rem auto" }}></div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading your reports...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "2rem" }}>
          <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
            <span>{error}</span>
          </div>
          <button onClick={fetchMyReports} className="btn btn-secondary" style={{ width: "auto" }}>
            Retry Loading
          </button>
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed var(--bg-card-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚩</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.4rem" }}>
            No reports submitted yet.
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
            You haven't flagged or reported any auctions. If you encounter fraudulent or misleading listings, you can report them directly from the item's auction page.
          </p>
          <Link to="/auctions" className="btn btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Browse Active Auctions
          </Link>
        </div>
      ) : (
        /* Reports List */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {reports.map((rep) => {
            const auctionTitle = rep.auction?.title || rep.auction?.product?.name || "Reported Auction";

            return (
              <div
                key={rep.id}
                className="card"
                style={{
                  padding: "1.5rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--bg-card-border)",
                  borderRadius: "var(--radius-md)",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                      {auctionTitle}
                    </h3>
                    <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                      Submitted on: {formatDate(rep.createdAt)}
                    </div>
                  </div>
                  {getStatusBadge(rep.status)}
                </div>

                <div style={{ padding: "0.85rem 1rem", background: "rgba(15, 23, 42, 0.6)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-dim)", fontWeight: "600", marginBottom: "0.25rem" }}>
                    Reason: <span style={{ color: "var(--text-main)", fontWeight: "700" }}>{rep.reason}</span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.5", whiteSpace: "pre-line" }}>
                    {rep.description}
                  </p>
                </div>

                {/* Admin Response/Reason if present */}
                {rep.adminReason ? (
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div style={{ fontSize: "0.825rem", fontWeight: "700", color: "#a5b4fc", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>💬 Admin Response</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-main)", margin: 0, fontStyle: "italic" }}>
                      "{rep.adminReason}"
                    </p>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                    ⏳ Under review by administrator. Response will appear here once processed.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyReports;
