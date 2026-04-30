const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    author_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    scope: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: 'product_reviews',
  },
);

productReviewSchema.index({ product_id: 1, scope: 1, updated_at: -1 });

productReviewSchema.pre('save', function updateTimestamp(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('ProductReview', productReviewSchema);
