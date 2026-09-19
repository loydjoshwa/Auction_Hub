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

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

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

  const handleEditProfile = () => {
    setEditName(profile?.name || "");
    setIsEditing((prev) => !prev);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = { ...profile, name: editName.trim() };
    setProfile(updated);
    updateUser(updated);
    setIsEditing(false);
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
                marginBottom: isEditing ? "1.5rem" : "2.25rem",
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.2rem" }}>
                      {profile?.name || "Marketplace User"}
                    </h1>
                    <button
                      type="button"
                      title="Edit Profile"
                      aria-label="Edit Profile"
                      onClick={handleEditProfile}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--bg-card-border)",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.color = "var(--text-main)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.borderColor = "var(--bg-card-border)";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
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

            {/* Inline Edit Form */}
            {isEditing && (
              <div
                style={{
                  marginBottom: "2.25rem",
                  padding: "1.25rem 1.5rem",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "0.75rem", color: "var(--text-main)" }}>
                  Edit Profile Name
                </h3>
                <form onSubmit={handleSaveProfile} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      padding: "0.55rem 0.85rem",
                      background: "var(--bg-main)",
                      border: "1px solid var(--bg-card-border)",
                      color: "var(--text-main)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                    }}
                    placeholder="Enter full name"
                    required
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "auto", padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-secondary"
                      style={{ width: "auto", padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Section 1: Account Activity */}
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

            {/* Section 2: Account Actions */}
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
                Account Actions
              </h2>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
