const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['bug', 'feature'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    category: {
      type: String,
      enum: ['general', 'crash', 'ui', 'performance', 'feature'],
      default: 'general',
    },
    appVersion: {
      type: String,
      default: '1.0.2',
    },
    platform: {
      type: String,
      default: 'mobile',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    submittedBy: {
      uid: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

supportRequestSchema.index({ createdAt: -1 });
supportRequestSchema.index({ type: 1, createdAt: -1 });
supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
