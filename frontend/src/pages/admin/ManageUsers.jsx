import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";

function ManageUsers() {
  const { token, user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal confirmation state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    actionType: "", // "block" or "unblock"
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(
    async (searchTerm, filterStatus) => {
      try {
        setLoading(true);
        setError("");
        const apiStatus = filterStatus === "all" ? "" : filterStatus;
        const res = await apiService.getAdminUsers(token, searchTerm, apiStatus);
        setUsersList(res.users || []);
      } catch (err) {
        setError(err.message || "Failed to fetch users list");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (token) {
        fetchUsers(search, statusFilter);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, token, fetchUsers]);

  const openConfirmation = (user, actionType) => {
    setError("");
    setSuccessMessage("");
    setConfirmModal({
      isOpen: true,
      user,
      actionType,
    });
  };

  const closeConfirmation = () => {
    setConfirmModal({
      isOpen: false,
      user: null,
      actionType: "",
    });
  };

  const handleConfirmAction = async () => {
    const { user, actionType } = confirmModal;
    if (!user) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      let res;
      if (actionType === "block") {
        res = await apiService.blockUser(token, user.id);
      } else {
        res = await apiService.unblockUser(token, user.id);
      }

      setSuccessMessage(res.message || `User ${actionType}ed successfully`);
      closeConfirmation();

      // Refresh table list
      fetchUsers(search, statusFilter);
    } catch (err) {
      setError(err.message || `Failed to ${actionType} user`);
      closeConfirmation();
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Auto-dismiss success message after 3.5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Manage Users</h1>
          <p className="admin-subtitle">View and manage system user accounts</p>
        </div>
        <div className="admin-nav-actions">
          <Link to="/admin" className="btn btn-secondary" style={{ width: "auto" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ justifyContent: "space-between" }}>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "1.1rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" style={{ justifyContent: "space-between" }}>
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "1.1rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="users-filter-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active Users
          </button>
          <button
            className={`filter-btn ${statusFilter === "blocked" ? "active" : ""}`}
            onClick={() => setStatusFilter("blocked")}
          >
            Blocked Users
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <span>Loading users...</span>
        </div>
      ) : usersList.length === 0 ? (
        <div className="empty-state-card">
          <h3>No users found</h3>
          <p>No user accounts matched your search criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user) => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <tr key={user.id}>
                    <td className="user-name-cell">
                      <div className="table-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span>{user.name}</span>
                      {isSelf && <span className="self-badge">(You)</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${(user.role || "user").toLowerCase()}`}>
                        {(user.role || "USER").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {user.isBlocked ? (
                        <span className="badge badge-blocked-status">Blocked</span>
                      ) : (
                        <span className="badge badge-active-status">Active</span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      {user.isBlocked ? (
                        <button
                          className="btn btn-secondary action-btn-unblock"
                          onClick={() => openConfirmation(user, "unblock")}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger action-btn-block"
                          onClick={() => openConfirmation(user, "block")}
                          disabled={isSelf}
                          title={isSelf ? "You cannot block your own account" : ""}
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog / Modal */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">
              {confirmModal.actionType === "block" ? "Confirm Block User" : "Confirm Unblock User"}
            </h3>
            <p className="modal-body">
              Are you sure you want to {confirmModal.actionType}{" "}
              <strong>{confirmModal.user?.name}</strong> ({confirmModal.user?.email})?
              {confirmModal.actionType === "block" &&
                " They will no longer be able to log in to their account."}
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeConfirmation}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                Cancel
              </button>
              <button
                className={`btn ${confirmModal.actionType === "block" ? "btn-danger" : "btn-primary"}`}
                onClick={handleConfirmAction}
                disabled={actionLoading}
                style={{ width: "auto" }}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : confirmModal.actionType === "block" ? (
                  "Block User"
                ) : (
                  "Unblock User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
