const mongoose = require('mongoose');
const { VALID_NOTIFICATION_KEYS } = require('../services/notificationCatalog');

const notificationDispatchLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: {
    type: String,
    required: true,
    enum: VALID_NOTIFICATION_KEYS,
  },
  delivery_slot: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sent_at: { type: Date, default: null },
  is_read: { type: Boolean, default: false },
  read_at: { type: Date, default: null },
  expo_ticket_id: { type: String, default: '' },
  error_message: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

notificationDispatchLogSchema.index(
  { user_id: 1, key: 1, delivery_slot: 1 },
  { unique: true },
);

notificationDispatchLogSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('NotificationDispatchLog', notificationDispatchLogSchema);
