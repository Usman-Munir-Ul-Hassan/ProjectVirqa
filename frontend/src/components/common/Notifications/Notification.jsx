import { useNotifications } from '../../../hooks/useNotificationHook';
import NotificationList from './components/NotificationList';
import { CheckCheck, Loader2, Bell } from 'lucide-react';

const SharedNotifications = ({ title = 'Notifications' }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetched,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications();

  return (
    <div className="max-w-8xl mx-auto p-3 sm:p-6 lg:p-8">
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-blue-600">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !fetched && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
            <p className="text-gray-500 mt-1">We'll notify you when something arrives.</p>
          </div>
        ) : (
          <>
            <NotificationList
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />

            {hasMore && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More Notifications'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedNotifications;
