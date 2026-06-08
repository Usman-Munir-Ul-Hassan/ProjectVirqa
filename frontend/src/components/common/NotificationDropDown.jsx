import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNotifications } from '../../hooks/useNotificationHook';

// Type icon + color mapping
const typeConfig = {
  interview: { emoji: '🎯', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  results: { emoji: '📊', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  system: { emoji: '⚙️', bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  reminders: { emoji: '⏰', bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
  employee: { emoji: '👤', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  candidate: { emoji: '🎓', bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500' },
};

const NotificationDropdown = ({
  iconColor = 'text-gray-600',
  iconHoverColor = 'text-gray-800',
  iconBg = 'bg-gray-100',
  iconSize = 18,
  viewAllPath = '/api/v1/candidates/notifications',
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetched,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) refetch();
  }, [isOpen, refetch]);

  const filteredNotifications = notifications.filter(
    (n) => filter === 'all' || (filter === 'unread' && !n.read)
  );

  const handleNotificationClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:${iconBg} transition-all duration-200 group`}
        aria-label="Notifications"
      >
        <Bell
          size={iconSize}
          className={`${iconColor} group-hover:${iconHoverColor} transition-colors`}
          strokeWidth={2}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-3 h-3 px-1 text-[8px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-1 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/70">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-blue-600 mt-0.5">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors group"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} className="text-blue-500 group-hover:text-blue-700" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100">
              <button
                className={clsx(
                  'flex-1 py-1 text-[10px] sm:text-xs rounded-md font-medium transition-colors',
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={clsx(
                  'flex-1 py-1 text-[10px] sm:text-xs rounded-md font-medium transition-colors',
                  filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {loading && !fetched && notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Loader2 size={20} className="mx-auto mb-2 text-gray-300 animate-spin" />
                  <p className="text-gray-500 text-xs">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={24} className="mx-auto mb-1 text-gray-300" />
                  <p className="text-gray-500 text-xs">No notifications</p>
                </div>
              ) : (
                <ul>
                  {filteredNotifications.slice(0, 8).map((notif) => {
                    const cfg = typeConfig[notif.type] || typeConfig.system;
                    return (
                      <li
                        key={notif.id}
                        className={clsx(
                          'relative p-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer last:border-b-0 group',
                          !notif.read && 'bg-blue-50/30'
                        )}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Type emoji/icon */}
                          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0', cfg.bg)}>
                            {cfg.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className={clsx('text-xs font-semibold leading-tight', notif.read ? 'text-gray-700' : 'text-gray-900')}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <div className={clsx('w-2 h-2 rounded-full shrink-0 mt-1', cfg.dot)} />
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[9px] text-gray-400">{notif.timestamp}</p>
                              <button
                                onClick={(e) => handleDelete(e, notif.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={10} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  navigate(viewAllPath);
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-gray-100 py-1.5 rounded-md transition-all"
              >
                Show All Notifications →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
