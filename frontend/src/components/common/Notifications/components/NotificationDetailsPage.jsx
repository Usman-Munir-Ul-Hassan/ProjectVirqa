'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NotificationDetails from './NotificationDetails.jsx';
import api from '../../../../utils/api.js';

const NotificationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/notifications/${id}`);
        setNotification(data?.data || null);

        // Mark as read when viewing
        if (data?.data && !data.data.read) {
          await api.patch(`/notifications/${id}/read`).catch(() => {});
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Notification not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchNotification();
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleNavigate = (route) => {
    navigate(route);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Loading notification...
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-lg">
        {error || "Notification not found"}
      </div>
    );
  }

  return (
    <NotificationDetails
      notification={{
        ...notification,
        timestamp: notification.timestamp || formatTimeAgo(notification.createdAt),
      }}
      onClose={handleClose}
      onNavigate={handleNavigate}
    />
  );
};

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

export default NotificationDetailsPage;
