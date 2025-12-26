const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { optionalAdmin } = require('../middleware/admin');
const { validate, eventSchemas } = require('../middleware/validation');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      city,
      country,
      featured,
      search,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      lat,
      lng,
      radius = 10000 // 10km default
    } = req.query;

    let query = {
      status: 'published',
      date: { $gte: new Date() }
    };

    // Category filter
    if (category) query.category = category;

    // Location filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');

    // Featured filter
    if (featured !== undefined) query.featured = featured === 'true';

    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      query.price = {};
      if (priceMin !== undefined) query.price.$gte = parseFloat(priceMin);
      if (priceMax !== undefined) query.price.$lte = parseFloat(priceMax);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    let eventsQuery = Event.find(query)
      .populate('organizerId', 'name profileImage isVerified')
      .sort({ featured: -1, date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Geospatial search if coordinates provided
    if (lat && lng) {
      eventsQuery = Event.find({
        ...query,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      })
      .populate('organizerId', 'name profileImage isVerified')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    }

    const events = await eventsQuery;
    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const events = await Event.findFeatured(parseInt(limit));

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured events',
      message: error.message
    });
  }
});

// @route   GET /api/events/nearby
// @desc    Get nearby events
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates required',
        message: 'Latitude and longitude are required'
      });
    }

    const events = await Event.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'published',
      date: { $gte: new Date() }
    })
    .populate('organizerId', 'name profileImage isVerified')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Get nearby events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby events',
      message: error.message
    });
  }
});

// @route   GET /api/events/categories
// @desc    Get events by category
// @access  Public
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const events = await Event.find({
      category,
      status: 'published',
      date: { $gte: new Date() }
    })
    .populate('organizerId', 'name profileImage isVerified')
    .sort({ date: 1 })
    .limit(parseInt(limit))
    .skip((page - 1) * limit);

    const total = await Event.countDocuments({
      category,
      status: 'published',
      date: { $gte: new Date() }
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get events by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events by category',
      message: error.message
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email bio phone location profileImage isVerified rating totalEvents');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Increment views (but not for the organizer)
    if (!req.user || req.user.uid !== event.organizerId.firebaseUid) {
      await event.incrementViews();
    }

    // Check if user has liked this event
    let hasLiked = false;
    if (req.user) {
      hasLiked = event.likes.some(like => like.userId === req.user.uid);
    }

    // Check if user is registered for this event
    let isRegistered = false;
    if (req.user) {
      isRegistered = event.attendees.some(attendee => attendee.userId === req.user.uid);
    }

    res.json({
      success: true,
      data: {
        ...event.toJSON(),
        hasLiked,
        isRegistered
      }
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private
router.post('/', 
  authenticateToken, 
  validate(eventSchemas.create), 
  async (req, res) => {
    try {
      const organizer = await Organizer.findByFirebaseUid(req.user.uid);

      if (!organizer) {
        return res.status(404).json({
          success: false,
          error: 'Organizer not found'
        });
      }

      const eventData = {
        ...req.body,
        organizerId: organizer._id
      };

      const event = new Event(eventData);
      await event.save();

      // Update organizer's total events count
      organizer.totalEvents += 1;
      await organizer.save();

      // Populate organizer info for response
      await event.populate('organizerId', 'name profileImage isVerified');

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create event',
        message: error.message
      });
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', 
  authenticateToken, 
  optionalAdmin,
  validate(eventSchemas.update), 
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Check if user is the organizer OR admin
      const organizer = await Organizer.findByFirebaseUid(req.user.uid);
      const isOwner = organizer && event.organizerId.equals(organizer._id);
      const isAdmin = req.isAdmin;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only update your own events'
        });
      }

      // Update event
      Object.assign(event, req.body);
      await event.save();

      await event.populate('organizerId', 'name profileImage isVerified');

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update event',
        message: error.message
      });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', authenticateToken, optionalAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user is the organizer OR admin
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);
    const isOwner = organizer && event.organizerId.equals(organizer._id);
    const isAdmin = req.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own events'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Update organizer's total events count
    if (isOwner) {
      organizer.totalEvents = Math.max(0, organizer.totalEvents - 1);
      await organizer.save();
    } else if (isAdmin) {
      // If admin deleted, update the original organizer's count
      await Organizer.findByIdAndUpdate(
        event.organizerId,
        { $inc: { totalEvents: -1 } }
      );
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for event
// @access  Private
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.date < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot register for past events'
      });
    }

    // Check if already registered
    const isAlreadyRegistered = event.attendees.some(
      attendee => attendee.userId === req.user.uid
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this event'
      });
    }

    // Check capacity
    if (event.capacity && event.attendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is at full capacity'
      });
    }

    await event.addAttendee(req.user.uid);

    res.json({
      success: true,
      message: 'Successfully registered for event',
      attendeeCount: event.attendees.length
    });

  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for event',
      message: error.message
    });
  }
});

// @route   DELETE /api/events/:id/register
// @desc    Unregister from event
// @access  Private
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await event.removeAttendee(req.user.uid);

    res.json({
      success: true,
      message: 'Successfully unregistered from event',
      attendeeCount: event.attendees.length
    });

  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister from event',
      message: error.message
    });
  }
});

// @route   POST /api/events/:id/like
// @desc    Toggle like for event
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const wasLiked = event.likes.some(like => like.userId === req.user.uid);
    await event.toggleLike(req.user.uid);

    res.json({
      success: true,
      message: wasLiked ? 'Event unliked' : 'Event liked',
      likeCount: event.likes.length,
      hasLiked: !wasLiked
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like',
      message: error.message
    });
  }
});

// @route   POST /api/events/:id/view
// @desc    Track event view
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Increment view count
    event.views = (event.views || 0) + 1;
    await event.save();

    res.json({
      success: true,
      message: 'View tracked',
      views: event.views
    });

  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view',
      message: error.message
    });
  }
});

module.exports = router;
