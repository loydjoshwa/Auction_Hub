/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import apiService from "../services/api";

const NotificationContext = createContext(null);

/**
 * Normalizes notification fields across Go backend PascalCase serialization
 * and standard JS camelCase / snake_case formats.
 */
export function normalizeNotification(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.ID ?? item.id,
    userId: item.UserID ?? item.userId ?? item.user_id,
    type: item.Type ?? item.type ?? "info",
    title: item.Title ?? item.title ?? "Notification",
    message: item.Message ?? item.message ?? "",
    isRead: Boolean(item.IsRead ?? item.isRead ?? item.is_read ?? false),
    createdAt: item.CreatedAt ?? item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.UpdatedAt ?? item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
  };
}

export function NotificationProvider({ children }) {
  const { token, isLoggedIn, user } = useAuth();
  const isAdmin = isLoggedIn && user?.role === "admin";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  /**
   * Fetch unread notification count.
   * GET /api/notifications/unread-count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!token || isAdmin) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await apiService.getUnreadNotificationCount(token);
      const count =
        typeof response?.unreadCount === "number"
          ? response.unreadCount
          : typeof response?.count === "number"
          ? response.count
          : 0;

      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err);
    }
  }, [token]);

  /**
   * Fetch all notifications for the logged-in user.
   * GET /api/notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!token || isAdmin) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getNotifications(token);
      const rawList = Array.isArray(response?.notifications)
        ? response.notifications
        : Array.isArray(response)
        ? response
        : [];

      const normalized = rawList
        .map(normalizeNotification)
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(normalized);
      setHasLoaded(true);

      // Reconcile unread count from freshly fetched list
      const calculatedUnread = normalized.filter((n) => !n.isRead).length;
      setUnreadCount(calculatedUnread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(err.message || "Failed to load notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Mark an individual notification as read.
   * PATCH /api/notifications/:id/read
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!token || !notificationId) return;

      const target = notifications.find((n) => n.id === notificationId);
      if (target && target.isRead) {
        return; // Already read
      }

      setMarkingIds((prev) => new Set(prev).add(notificationId));

      try {
        await apiService.markNotificationAsRead(token, notificationId);

        // Update notification read state in UI
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(`Failed to mark notification #${notificationId} as read:`, err);
        throw err;
      } finally {
        setMarkingIds((prev) => {
          const next = new Set(prev);
          next.delete(notificationId);
          return next;
        });
      }
    },
    [token, notifications]
  );

  /**
   * Mark all notifications as read.
   * PATCH /api/notifications/read-all
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    setIsMarkingAll(true);
    setError(null);

    try {
      await apiService.markAllNotificationsAsRead(token);

      // Mark all current notifications as read
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setError(err.message || "Failed to mark all as read. Please try again.");
      throw err;
    } finally {
      setIsMarkingAll(false);
    }
  }, [token]);

  /**
   * Helper prepared for WebSocket real-time notification pushes.
   * Seamlessly adds incoming notifications without requiring polling or fake socket.
   */
  const handleIncomingNotification = useCallback((incoming) => {
    const normalized = normalizeNotification(incoming);
    if (!normalized) return;

    setNotifications((prev) => {
      // Prevent duplicates if already present
      if (prev.some((n) => n.id === normalized.id)) {
        return prev;
      }
      return [normalized, ...prev];
    });

    if (!normalized.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Fetch unread count when user logs in or page loads
  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn || !token || isAdmin) {
      queueMicrotask(() => {
        if (!isMounted) return;
        setNotifications([]);
        setUnreadCount(0);
        setHasLoaded(false);
        setError(null);
      });
      return () => {
        isMounted = false;
      };
    }

    apiService
      .getUnreadNotificationCount(token)
      .then((response) => {
        if (!isMounted) return;
        const count =
          typeof response?.unreadCount === "number"
            ? response.unreadCount
            : typeof response?.count === "number"
            ? response.count
            : 0;
        setUnreadCount(count);
      })
      .catch((err) => {
        console.error("Failed to fetch unread notification count:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, token, isAdmin]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    isMarkingAll,
    markingIds,
    error,
    hasLoaded,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    handleIncomingNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;
