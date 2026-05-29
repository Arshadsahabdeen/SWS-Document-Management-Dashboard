import toast from "react-hot-toast";

const typeStyles = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-rose-100 text-rose-700",
  info: "bg-blue-100 text-brand-700"
};

function formatNotificationDate(notification) {
  const value = notification.timestamp || notification.createdAt;
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function NotificationsPage({
  notifications,
  isLoading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onRefresh
}) {
  const visibleNotifications = notifications.filter((notification) => !notification.read);
  const handleMarkRead = async (id) => {
    try {
      await onMarkRead(id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await onMarkAllRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update notifications");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Notification Center
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            System Notifications
          </h1>
        </div>
        <div className="flex gap-3">
          <button type="button" className="secondary-button" onClick={onRefresh}>
            Refresh
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!unreadCount}
            onClick={handleMarkAllRead}
          >
            Mark All Read
          </button>
        </div>
      </div>

      <section className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Unread Notifications</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {unreadCount} unread
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center px-5 py-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-brand-600" />
              Loading notifications
            </span>
          </div>
        ) : visibleNotifications.length ? (
          <div className="divide-y divide-blue-50">
            {visibleNotifications.map((notification) => (
              <article
                key={notification._id}
                className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  notification.read ? "bg-white" : "bg-blue-50/60"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        typeStyles[notification.type] || typeStyles.info
                      }`}
                    >
                      {notification.type}
                    </span>
                    {!notification.read && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-blue-100">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNotificationDate(notification)}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button shrink-0"
                  disabled={notification.read}
                  onClick={() => handleMarkRead(notification._id)}
                >
                  Mark Read
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm font-medium text-slate-500">
            No unread notifications
          </div>
        )}
      </section>
    </div>
  );
}

export default NotificationsPage;
