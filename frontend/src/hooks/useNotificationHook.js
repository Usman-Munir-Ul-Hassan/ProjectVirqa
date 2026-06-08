import { useState, useEffect, useCallback, useRef } from 'react';
import { io as socketIO } from 'socket.io-client';
import api from '../utils/api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// ─── Format relative time ──────────────────────────────────────────
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Main hook ─────────────────────────────────────────────────────
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef(null);
  const userIdRef = useRef(null);

  // ── Fetch notifications from API ────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/notifications?page=${pageNum}&limit=10`);
      const fetched = data?.data?.notifications || [];
      const pagination = data?.data?.pagination || {};
      const serverUnread = data?.data?.unreadCount ?? 0;

      const formatted = fetched.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        details: n.details,
        type: n.type,
        read: n.read,
        timestamp: formatTimeAgo(n.createdAt),
        createdAt: n.createdAt,
        link: n.link,
        sender: n.sender,
        relatedEntity: n.relatedEntity,
      }));

      if (append) {
        setNotifications((prev) => [...prev, ...formatted]);
      } else {
        setNotifications(formatted);
      }
      setUnreadCount(serverUnread);
      setHasMore(pagination.page < pagination.totalPages);
      setFetched(true);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err?.response?.data?.message || 'Failed to load notifications');
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch unread count ──────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data?.data?.unreadCount ?? 0);
    } catch {
      // Silent fail — unread count is non-critical
    }
  }, []);

  // ── Mark as read ────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  // ── Mark as unread ──────────────────────────────────────────────
  const markAsUnread = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to mark as unread:', err);
    }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // ── Delete a notification ───────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount(data?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // ── Load more (pagination) ──────────────────────────────────────
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  }, [hasMore, loading, page, fetchNotifications]);

  // ── Socket.IO connection for real-time updates ──────────────────
  useEffect(() => {
    // Get user ID from localStorage/Redux
    let userId = null;
    try {
      const authState = JSON.parse(localStorage.getItem('persist:root') || '{}');
      const userObj = JSON.parse(authState?.auth || '{}');
      userId = userObj?.user?._id || userObj?.user?.id;
    } catch {
      // Try alternative storage
    }

    if (!userId) {
      setLoading(false);
      return;
    }
    userIdRef.current = userId;

    const socket = socketIO(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', userId);
    });

    socket.on('new_notification', (notification) => {
      const formatted = {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        details: notification.details,
        type: notification.type,
        read: notification.read,
        timestamp: formatTimeAgo(notification.createdAt),
        createdAt: notification.createdAt,
        link: notification.link,
        sender: notification.sender,
        relatedEntity: notification.relatedEntity,
      };
      setNotifications((prev) => [formatted, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('unread_count', ({ unreadCount: count }) => {
      setUnreadCount(count);
    });

    socket.on('disconnect', () => {
      // Reconnection is handled automatically by socket.io
    });

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    return () => {
      socket.emit('leave_notifications', userId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetched,
    error,
    hasMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refetch: () => fetchNotifications(1, false),
  };
};

export default useNotifications;
