import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function AdminProfile() {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");
        const res = await apiService.getProfile(token);
        const userData = res?.user || res;
        if (isMounted && userData) {
          setProfile(userData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load admin profile information");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleEditClick = () => {
    setEditName(profile?.name || "");
    setSaveError("");
    setIsEditing((prev) => !prev);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;

    setSaving(true);
    setSaveError("");

    try {
      const res = await apiService.updateProfile(token, trimmed);
      const updatedUser = res?.user || res;
      if (updatedUser) {
        setProfile(updatedUser);
        if (updateUser) updateUser(updatedUser);
      }
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile name.");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <div className="admin-page-container" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: "1.8rem", fontWeight: "800" }}>Admin Profile</h1>
          <p className="admin-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Account details for the currently authenticated administrator
          </p>
        </div>
        <div className="admin-nav-actions">
          <Link to="/admin" className="btn btn-secondary" style={{ width: "auto" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "3rem 0" }}>
          <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto 0.75rem auto" }}></div>
          <span style={{ color: "var(--text-muted)" }}>Loading profile...</span>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "2rem",
            position: "relative",
            overflow: "hidden",
            background: "var(--bg-card)",
            border: "1px solid var(--bg-card-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {/* Top Accent Border */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: "800",
                color: "#ffffff",
                boxShadow: "0 0 18px rgba(236, 72, 153, 0.35)",
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                  {profile?.name || "Administrator"}
                </h2>
                <button
                  type="button"
                  onClick={handleEditClick}
                  title="Edit Name"
                  aria-label="Edit Name"
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
                    padding: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>

              {isEditing && (
                <form onSubmit={handleSaveName} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.9rem", width: "auto", flex: 1, maxWidth: "260px" }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                  <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: "auto", padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ width: "auto", padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
                    Cancel
                  </button>
                </form>
              )}

              {saveError && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.35rem" }}>{saveError}</p>
              )}

              <span className="badge badge-admin" style={{ marginTop: "0.35rem", display: "inline-block" }}>
                {profile?.role ? profile.role.toUpperCase() : "ADMIN"}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div
              style={{
                padding: "1rem 1.25rem",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--bg-card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Full Name
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.25rem" }}>
                  {profile?.name || "N/A"}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.25rem",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--bg-card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email Address
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.25rem" }}>
                  {profile?.email || "N/A"}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.25rem",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--bg-card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  System Role
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#f472b6", marginTop: "0.25rem" }}>
                  {profile?.role || "admin"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfile;

