const mongoose = require('mongoose');
const { VALID_NOTIFICATION_KEYS } = require('../services/notificationCatalog');

const notificationTemplateSchema = new mongoose.Schema({
  // Unique key for each notification type
  key: { type: String, required: true, unique: true, enum: VALID_NOTIFICATION_KEYS },

  // Display label for admin
  label: { type: String, required: true },

  // Notification content
  title: { type: String, required: true },
  body: { type: String, required: true },

  // Time to send (hour:minute in 24h format)
  hour: { type: Number, required: true, min: 0, max: 23 },
  minute: { type: Number, required: true, min: 0, max: 59 },

  // Whether this template is active
  is_active: { type: Boolean, default: true },

  // Metadata
  description: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

notificationTemplateSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
