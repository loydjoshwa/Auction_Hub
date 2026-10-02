import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function Dashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalProducts: 0,
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");
        const res = await apiService.getAdminDashboard(token);
        if (res.analytics) {
          setAnalytics(res.analytics);
        }
      } catch (err) {
        setError(err.message || "Failed to load admin analytics");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  return (
    <div className="admin-page-container" style={{ maxWidth: "1240px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="admin-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Auction Hub Admin</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Real-time platform oversight & management dashboard</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "4rem 0" }}>
          <div className="spinner" style={{ width: "36px", height: "36px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading live platform analytics...</span>
        </div>
      ) : (
        <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          <div className="stat-card" style={{ padding: "1.5rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
            <div className="stat-label" style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Total Users</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.2rem" }}>{analytics.totalUsers}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Registered user accounts</div>
          </div>

          <div className="stat-card stat-card-active" style={{ padding: "1.5rem", background: "rgba(16, 185, 129, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div className="stat-label" style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Active Users</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#34d399", marginBottom: "0.2rem" }}>{analytics.activeUsers}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Users in good standing</div>
          </div>

          <div className="stat-card stat-card-blocked" style={{ padding: "1.5rem", background: "rgba(239, 68, 68, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <div className="stat-label" style={{ color: "#f87171", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Blocked Users</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#f87171", marginBottom: "0.2rem" }}>{analytics.blockedUsers}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Accounts currently suspended</div>
          </div>

          <div className="stat-card" style={{ padding: "1.5rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
            <div className="stat-label" style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Total Products</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.2rem" }}>{analytics.totalProducts}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Listed items across sellers</div>
          </div>

          <div className="stat-card" style={{ padding: "1.5rem", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <div className="stat-label" style={{ color: "#a5b4fc", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Active Auctions</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#a5b4fc", marginBottom: "0.2rem" }}>{analytics.activeAuctions}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Out of {analytics.totalAuctions} total auctions</div>
          </div>

          <div className="stat-card" style={{ padding: "1.5rem", background: "rgba(245, 158, 11, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <div className="stat-label" style={{ color: "#fbbf24", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Total Bids</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#fbbf24", marginBottom: "0.2rem" }}>{analytics.totalBids}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Bids submitted by users</div>
          </div>

          <div className="stat-card" style={{ padding: "1.5rem", background: "rgba(16, 185, 129, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div className="stat-label" style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.35rem" }}>Total Orders</div>
            <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "#34d399", marginBottom: "0.2rem" }}>{analytics.totalOrders}</div>
            <div className="stat-desc" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Completed auction transactions</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
