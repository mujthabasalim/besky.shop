const Notification = require("../models/Notification");

const createNotification = async ({
  title,
  message,
  refId,
  refType,
  type,
  notificationFor,
  userId,
}) => {
  try {
    const newNotification = new Notification({
      title,
      message,
      refId,
      refType,
      type,
      notificationFor,
      userId,
    });
    return await newNotification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

async function getNotificationsByRef(refId, refType) {
  try {
    const notifications = await Notification.find({ refId, refType });
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

async function markAsRead(notificationId) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

module.exports = {
  createNotification,
  getNotificationsByRef,
  markAsRead,
};
