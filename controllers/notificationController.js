const Notification = require('../models/Notification');
const { getNotificationIconClass } = require("../utils/notificationClass");

const getNotifications = async (req, res) => {
  try {
    // Fetch all notifications (no refId or refType needed)
    const notifications = await Notification.find({ 
      isRead: false, 
      notificationFor: { $in: ['admin'] }
    }).sort({ createdAt: -1 });

    // Add iconClass for each notification based on its title
    notifications.forEach(notification => {
      notification.iconClass = getNotificationIconClass(notification.title);
      notification.formattedDate = notification.createdAt.toLocaleDateString();
      notification.formattedTime = notification.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    // Render notifications view, passing the notifications array
    res.render('admin/notification', { notifications });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  const notificationId = req.params.id;

  try {
    // Find the notification by ID and update its isRead field to true
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    // Optionally, you can return a success message or redirect back to notifications
    return res.json({ success: true, message: 'Notification marked as read' });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
}