const mongoose = require('mongoose');

const broadcastNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      uid: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BroadcastNotification', broadcastNotificationSchema);
