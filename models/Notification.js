const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  title: { type: String, required: true },
  notificationFor: { type: [String], enum: ['user', 'admin', 'general'], default: ['general'] },
  message: { type: String, required: true },
  refId: { type: Schema.Types.ObjectId, required: true },
  refType: { type: String, required: true },
  type: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ refId: 1, refType: 1 });
NotificationSchema.index({ notificationFor: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
