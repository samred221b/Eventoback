const mongoose = require('mongoose');

const messageRecipientSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
      required: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['broadcast', 'individual'],
      required: true,
      index: true,
    },
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
      maxlength: 5000,
    },
    recipients: {
      type: [messageRecipientSchema],
      default: [],
    },
    createdBy: {
      uid: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ createdAt: -1 });
messageSchema.index({ 'recipients.organizerId': 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
