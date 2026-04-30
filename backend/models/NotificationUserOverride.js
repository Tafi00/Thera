const mongoose = require('mongoose');
const { VALID_NOTIFICATION_KEYS } = require('../services/notificationCatalog');

const notificationUserOverrideSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  key: {
    type: String,
    required: true,
    enum: VALID_NOTIFICATION_KEYS,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  hour: { type: Number, required: true, min: 0, max: 23 },
  minute: { type: Number, required: true, min: 0, max: 59 },
  is_active: { type: Boolean, default: true },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

notificationUserOverrideSchema.index({ user_id: 1, key: 1 }, { unique: true });

notificationUserOverrideSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('NotificationUserOverride', notificationUserOverrideSchema);
