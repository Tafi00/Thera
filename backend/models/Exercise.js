const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  video_url: { type: String, required: true },
  video_urls_by_pain: {
    no_pain: { type: String, default: '' },
    mild: { type: String, default: '' },
    moderate: { type: String, default: '' },
    severe: { type: String, default: '' },
  },
  thumbnail_url: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  target_areas: [{ type: String }],
  category: { type: String, required: true },
  tags: [{ type: String }],
  instructions: { type: mongoose.Schema.Types.Mixed, default: [] },
  benefits: [{ type: String }],
  variations: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_pro: { type: Boolean, default: false },
  order_index: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Exercise', exerciseSchema);
