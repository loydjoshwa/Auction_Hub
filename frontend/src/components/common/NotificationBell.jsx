import { useState, useRef, useEffect, useMemo } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

/**
 * Format timestamp into user-friendly relative or local date time.
 */
function formatTime(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) {
      return "Just now";
    }
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Render category-specific visual icon based on notification type.
 */
function NotificationTypeIcon({ type }) {
  const normalizedType = (type || "").toLowerCase();

  if (normalizedType.includes("bid") || normalizedType.includes("outbid")) {
    return (
      <div className="notif-type-icon notif-icon-bid" title="Bid">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14 13-7.5 7.5c-.8.8-2.2.8-3 0s-.8-2.2 0-3L11 10" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
      </div>
    );
  }

  if (normalizedType.includes("won") || normalizedType.includes("winner")) {
    return (
      <div className="notif-type-icon notif-icon-win" title="Auction Won">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>
    );
  }

  if (normalizedType.includes("order")) {
    return (
      <div className="notif-type-icon notif-icon-order" title="Order">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
    );
  }

  if (normalizedType.includes("report") || normalizedType.includes("alert") || normalizedType.includes("pause")) {
    return (
      <div className="notif-type-icon notif-icon-alert" title="Alert">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );
  }

  // Default notification icon
  return (
    <div className="notif-type-icon notif-icon-info" title="Notification">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </div>
  );
}

export default function NotificationBell() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    isMarkingAll,
    markingIds,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'read'
  const [actionError, setActionError] = useState(null);

  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Toggle dropdown and load notifications when opening
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    setActionError(null);

    if (nextState) {
      fetchNotifications();
    }
  };

  // Filter notifications according to active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab === "read") {
      return notifications.filter((n) => n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Read count for the Read tab badge
  const readCount = useMemo(() => {
    return notifications.filter((n) => n.isRead).length;
  }, [notifications]);

  // Handle individual notification click
  const handleNotificationClick = async (notification) => {
    if (notification.isRead) return;

    setActionError(null);
    try {
      await markAsRead(notification.id);
    } catch (err) {
      setActionError(err.message || "Failed to mark notification as read.");
    }
  };

  // Handle Mark All as Read click
  const handleMarkAll = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    setActionError(null);
    try {
      await markAllAsRead();
    } catch (err) {
      setActionError(err.message || "Failed to mark all as read.");
    }
  };

  // Display unread badge formatting
  const displayBadgeText = unreadCount > 99 ? "99+" : unreadCount;

  if (user?.role === "admin") {
    return null;
  }

  return (
    <div className="notif-bell-container" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`notif-bell-btn ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="notif-bell-icon"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
            {displayBadgeText}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notif-dropdown-panel" role="region" aria-label="Notifications Panel">
          {/* Header */}
          <div className="notif-dropdown-header">
            <div className="notif-header-title-wrap">
              <h3 className="notif-dropdown-title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <button
              type="button"
              className="notif-mark-all-btn"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || isMarkingAll}
              title={unreadCount === 0 ? "No unread notifications" : "Mark all notifications as read"}
            >
              {isMarkingAll ? (
                <span className="notif-btn-loading">
                  <span className="notif-mini-spinner" />
                  Marking...
                </span>
              ) : (
                "Mark All as Read"
              )}
            </button>
          </div>

          {/* Action error banner if mutation failed */}
          {actionError && (
            <div className="notif-action-error-bar">
              <span>{actionError}</span>
              <button
                type="button"
                className="notif-close-error-btn"
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="notif-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              className={`notif-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
              <span className="notif-tab-count">{notifications.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "unread"}
              className={`notif-tab ${activeTab === "unread" ? "active" : ""}`}
              onClick={() => setActiveTab("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <span className="notif-tab-count notif-tab-unread-count">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "read"}
              className={`notif-tab ${activeTab === "read" ? "active" : ""}`}
              onClick={() => setActiveTab("read")}
            >
              Read
              <span className="notif-tab-count">{readCount}</span>
            </button>
          </div>

          {/* Notification List Content */}
          <div className="notif-list-container">
            {isLoading ? (
              <div className="notif-loading-state">
                <div className="notif-spinner" />
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notif-error-state">
                <div className="notif-error-icon">!</div>
                <p className="notif-error-message">{error}</p>
                <button
                  type="button"
                  className="btn btn-secondary notif-retry-btn"
                  onClick={() => fetchNotifications(true)}
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon-wrapper">
                  {activeTab === "unread" ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  )}
                </div>
                <h4 className="notif-empty-title">
                  {activeTab === "unread"
                    ? "All Caught Up!"
                    : activeTab === "read"
                    ? "No Read Notifications"
                    : "No Notifications Yet"}
                </h4>
                <p className="notif-empty-desc">
                  {activeTab === "unread"
                    ? "You have zero unread notifications."
                    : activeTab === "read"
                    ? "Notifications you have read will appear here."
                    : "You'll be alerted when there are updates on bids, auctions, and orders."}
                </p>
              </div>
            ) : (
              <div className="notif-items-list" role="feed">
                {filteredNotifications.map((notif) => {
                  const isItemMarking = markingIds.has(notif.id);

                  return (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.isRead ? "read" : "unread"} ${isItemMarking ? "marking" : ""}`}
                      onClick={() => handleNotificationClick(notif)}
                      role="article"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(notif);
                        }
                      }}
                      title={notif.isRead ? "Marked as read" : "Click to mark as read"}
                    >
                      <NotificationTypeIcon type={notif.type} />

                      <div className="notif-item-body">
                        <div className="notif-item-header">
                          <h4 className="notif-item-title">{notif.title}</h4>
                          <span className="notif-item-time">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>

                        <p className="notif-item-message">{notif.message}</p>
                      </div>

                      {/* Small glowing unread indicator dot */}
                      {!notif.isRead && (
                        <div className="notif-unread-dot" title="Unread notification" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
