const mongoose = require('mongoose');

const personalizedPlanVideoSchema = new mongoose.Schema({
  video_group: {
    type: String,
    enum: ['regular', 'device_supported'],
    default: 'regular',
    required: true,
    index: true,
  },
  title: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  link: { type: String, required: true, trim: true },
  is_active: { type: Boolean, default: true, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

personalizedPlanVideoSchema.index({ video_group: 1, is_active: 1 });

personalizedPlanVideoSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('PersonalizedPlanVideo', personalizedPlanVideoSchema);
