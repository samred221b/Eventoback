const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  // Firebase UID as primary identifier
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      maxlength: 200,
      trim: true
    },
    city: {
      type: String,
      maxlength: 50,
      trim: true
    },
    country: {
      type: String,
      maxlength: 50,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Profile Information
  profileImage: {
    type: String, // URL to profile image
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  },
  
  // Statistics
  totalEvents: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Social Links
  socialLinks: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
organizerSchema.index({ email: 1 });
organizerSchema.index({ 'location.city': 1 });
organizerSchema.index({ isActive: 1 });
organizerSchema.index({ createdAt: -1 });

// Virtual for events
organizerSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'organizerId'
});

// Pre-save middleware to update updatedAt
organizerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to update last login
organizerSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = Date.now();
  return this.save();
};

// Static method to find by Firebase UID
organizerSchema.statics.findByFirebaseUid = function(uid) {
  return this.findOne({ firebaseUid: uid });
};

// Static method to get organizer stats
organizerSchema.statics.getOrganizerStats = function(organizerId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(organizerId) } },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: 'organizerId',
        as: 'events'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        totalEvents: { $size: '$events' },
        upcomingEvents: {
          $size: {
            $filter: {
              input: '$events',
              cond: { $gte: ['$$this.date', new Date()] }
            }
          }
        },
        pastEvents: {
          $size: {
            $filter: {
              input: '$events',
              cond: { $lt: ['$$this.date', new Date()] }
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Organizer', organizerSchema);
