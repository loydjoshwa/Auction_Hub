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
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Auction Hub Admin</h1>
          <p className="admin-subtitle">System administration and user oversight</p>
        </div>
        <div className="admin-nav-actions">
          <Link to="/admin/users" className="btn btn-primary" style={{ width: "auto" }}>
            Manage Users
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <span>Loading analytics...</span>
        </div>
      ) : (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{analytics.totalUsers}</div>
            <div className="stat-desc">Registered accounts on the platform</div>
          </div>

          <div className="stat-card stat-card-active">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{analytics.activeUsers}</div>
            <div className="stat-desc">Users in good standing</div>
          </div>

          <div className="stat-card stat-card-blocked">
            <div className="stat-label">Blocked Users</div>
            <div className="stat-value">{analytics.blockedUsers}</div>
            <div className="stat-desc">Accounts currently suspended</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
