import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function Profile() {
  const navigate = useNavigate();
  const { token, user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If no token exists, redirect to login
    if (!token) {
      logout();
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiService.getProfile(token);

        if (response && response.user) {
          setProfile(response.user);
          // Sync with AuthContext and localStorage
          updateUser(response.user);
        } else {
          setProfile(response);
        }
      } catch (err) {
        // If token is invalid (401) or forbidden (403), clear storage and redirect
        if (err.status === 401 || err.status === 403) {
          logout();
          navigate("/login");
          return;
        }

        setError(err.message || "Unable to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, logout, updateUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "badge badge-admin";
    if (r === "seller") return "badge badge-seller";
    return "badge badge-user";
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div
        className="card"
        style={{
          padding: "2.5rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent top border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid var(--bg-card-border)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)" }}>
              User Profile
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
              Your account details and authentication session
            </p>
          </div>

          <span className={getRoleBadgeClass(profile?.role)}>
            {profile?.role || "USER"}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 1rem auto" }}></div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Fetching profile data from server...</p>
          </div>
        ) : error ? (
          <div>
            <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Retry Profile Fetch
            </button>
          </div>
        ) : (
          <div>
            {/* Header User Avatar Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                marginBottom: "2rem",
                padding: "1.25rem",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--bg-card-border)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  fontWeight: "800",
                  color: "#ffffff",
                  boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
                }}
              >
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-main)" }}>
                  {profile?.name || "N/A"}
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {profile?.email || "N/A"}
                </p>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Full Name
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-main)" }}>
                  {profile?.name || "N/A"}
                </div>
              </div>

              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Email Address
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-main)" }}>
                  {profile?.email || "N/A"}
                </div>
              </div>

              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  User ID
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "600", color: "#a5b4fc", fontFamily: "monospace" }}>
                  #{profile?.id || "N/A"}
                </div>
              </div>

              <div
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Account Role
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-main)", textTransform: "capitalize" }}>
                  {profile?.role || "User"}
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ width: "auto", padding: "0.75rem 1.75rem" }}
              >
                Logout Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
