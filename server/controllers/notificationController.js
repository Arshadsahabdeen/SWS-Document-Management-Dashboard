const getNotifications = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification list endpoint is ready",
    notifications: []
  });
};

const markNotificationRead = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification marked as read endpoint is ready",
    notificationId: req.params.id
  });
};

const markAllNotificationsRead = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mark all notifications as read endpoint is ready"
  });
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
