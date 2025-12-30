const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  image: {
    type: String, // URL to event image (can be http://, https://, or file:// for local development)
    validate: {
      validator: function(v) {
        // Allow http://, https://, file://, or data: URIs
        return !v || /^(https?|file|data):\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  },
  
  // Mode (Online/In-person)
  mode: {
    type: String,
    enum: ['In-person', 'Online'],
    required: true,
    default: 'In-person',
    trim: true
  },

  // Category
  category: {
    type: String,
    required: true,
    enum: [
      'music', 'culture', 'education', 'sports', 'art', 'business', 
      'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
      'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference', 'religious'
    ]
  },
  
  // Location Information
  location: {
    address: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true
    },
    city: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true
    },
    country: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true
    },
    // Legacy coordinates for backward compatibility
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    // GeoJSON point for geospatial queries
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { 
        type: [Number], 
        required: true,
        validate: {
          validator: function(coords) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates. Must be [longitude, latitude]'
        }
      }
    }
  },
  
  // Date and Time
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i.test(v);
      },
      message: 'Time must be in hh:mm AM/PM format'
    }
  },
  
  // Organizer Reference
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
    index: true
  },
  
  // Organizer Name (for display purposes)
  organizerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Event Properties
  featured: {
    type: Boolean,
    default: false
  },
  
  capacity: {
    type: Number,
    min: 1,
    max: 100000
  },
  
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Additional pricing options (optional)
  vipPrice: {
    type: Number,
    min: 0
  },
  
  vvipPrice: {
    type: Number,
    min: 0
  },
  
  onDoorPrice: {
    type: Number,
    min: 0
  },
  
  earlyBirdPrice: {
    type: Number,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'ETB',
    maxlength: 3
  },
  
  // Tags for better searchability
  tags: [{
    type: String,
    maxlength: 30,
    trim: true
  }],
  
  // Important Information (optional)
  importantInfo: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Tickets Available At (optional)
  ticketsAvailableAt: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  
  // Attendance
  attendees: [{
    userId: {
      type: String, // Firebase UID
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'no-show'],
      default: 'registered'
    }
  }],
  
  // Statistics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  likes: [{
    userId: String, // Firebase UID
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
eventSchema.index({ organizerId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ featured: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ 'location.geo': '2dsphere' }); // For geospatial queries
eventSchema.index({ createdAt: -1 });
eventSchema.index({ title: 'text', description: 'text' }); // For text search

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.length : 0;
});

// Virtual for like count
eventSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Virtual to check if event is past
eventSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Pre-save middleware to sync coordinates
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-populate geo field from coordinates if not set
  if (this.location.coordinates && !this.location.geo.coordinates) {
    this.location.geo = {
      type: 'Point',
      coordinates: [this.location.coordinates.lng, this.location.coordinates.lat]
    };
  }
  
  next();
});

// Instance method to add attendee
eventSchema.methods.addAttendee = function(userId) {
  const existingAttendee = this.attendees.find(a => a.userId === userId);
  if (!existingAttendee) {
    this.attendees.push({ userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove attendee
eventSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(a => a.userId !== userId);
  return this.save();
};

// Instance method to toggle like
eventSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(l => l.userId === userId);
  if (existingLike) {
    this.likes = this.likes.filter(l => l.userId !== userId);
  } else {
    this.likes.push({ userId });
  }
  return this.save();
};

// Instance method to increment views
eventSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find nearby events
eventSchema.statics.findNearby = function(lat, lng, maxDistance = 10000) {
  return this.find({
    'location.geo': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'published',
    date: { $gte: new Date() }
  });
};

// Static method to find featured events
eventSchema.statics.findFeatured = function(limit = 10) {
  return this.find({
    featured: true,
    status: 'published',
    date: { $gte: new Date() }
  })
  .populate('organizerId', 'name profileImage')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to find events by category
eventSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({
    category,
    status: 'published',
    date: { $gte: new Date() }
  })
  .populate('organizerId', 'name profileImage')
  .sort({ date: 1 })
  .limit(limit);
};

// Static method to search events
eventSchema.statics.searchEvents = function(query, options = {}) {
  const {
    category,
    city,
    dateFrom,
    dateTo,
    priceMin,
    priceMax,
    limit = 20,
    skip = 0
  } = options;

  let searchQuery = {
    status: 'published',
    date: { $gte: new Date() }
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Category filter
  if (category) {
    searchQuery.category = category;
  }

  // Location filter
  if (city) {
    searchQuery['location.city'] = new RegExp(city, 'i');
  }

  // Date range filter
  if (dateFrom || dateTo) {
    searchQuery.date = {};
    if (dateFrom) searchQuery.date.$gte = new Date(dateFrom);
    if (dateTo) searchQuery.date.$lte = new Date(dateTo);
  }

  // Price range filter
  if (priceMin !== undefined || priceMax !== undefined) {
    searchQuery.price = {};
    if (priceMin !== undefined) searchQuery.price.$gte = priceMin;
    if (priceMax !== undefined) searchQuery.price.$lte = priceMax;
  }

  return this.find(searchQuery)
    .populate('organizerId', 'name profileImage')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Event', eventSchema);
