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
    let isMounted = true;

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
        const userData = response?.user || response;

        if (isMounted && userData) {
          setProfile(userData);
          updateUser(userData);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 401 || err.status === 403) {
            logout();
            navigate("/login");
            return;
          }

          setError(err.message || "Unable to load profile. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token, navigate, logout, updateUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "badge badge-admin";
    if (r === "seller") return "badge badge-seller";
    return "badge badge-user";
  };

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
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
            {/* Header / Avatar Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1.25rem",
                marginBottom: "2.25rem",
                padding: "1.5rem",
                background: "rgba(255, 255, 255, 0.025)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--bg-card-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: "#ffffff",
                    boxShadow: "0 0 18px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {getInitials(profile?.name)}
                </div>

                <div>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    {profile?.name || "Marketplace User"}
                  </h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {profile?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span className={getRoleBadgeClass(profile?.role)}>
                  {profile?.role || "USER"}
                </span>

                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    color: "#10b981",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}></span>
                  Active
                </span>

                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  Member since 2026
                </span>
              </div>
            </div>

            {/* Section 1: Account Information */}
            <div style={{ marginBottom: "2.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
                Account Information
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
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
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)" }}>
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
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)", wordBreak: "break-all" }}>
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
                    Account Type
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)", textTransform: "capitalize" }}>
                    {profile?.role || "User"}
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
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "#a5b4fc", fontFamily: "monospace" }}>
                    #{profile?.id || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Account Activity */}
            <div style={{ marginBottom: "2.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
                Account Activity
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1.25rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--bg-card-border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔨</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    My Bids
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Active & recent bids
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--bg-card-border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🏆</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    Won Auctions
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Items won & claimed
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--bg-card-border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📦</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    Orders
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Purchase history
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--bg-card-border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🏷️</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                    Selling
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    My product listings
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Account Actions */}
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
                Account Actions
              </h2>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: "auto", padding: "0.75rem 1.5rem" }}
                >
                  Edit Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ width: "auto", padding: "0.75rem 1.75rem" }}
                >
                  Logout Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
