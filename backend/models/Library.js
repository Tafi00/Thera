const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  title: { type: String, trim: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Hiểu đúng về bài tập',
      'Liệu pháp MC GILL',
      'Liệu pháp MC KENZIE',
      'Yoga Trị Liệu',
      'Dưỡng sinh Trị liệu',
      'Tập cùng TheraNECK'
    ]
  },
  coverImage: { type: String },
  link: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

librarySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Library', librarySchema);
