const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    actionType: {
      type: String,
      enum: ['none', 'url', 'route', 'event'],
      default: 'none',
    },
    actionTarget: { type: String }, // URL, route name, or event ID depending on actionType
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', BannerSchema);
