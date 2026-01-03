const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Message = require('../models/Message');
const BroadcastNotification = require('../models/BroadcastNotification');

const router = express.Router();

// @route   GET /api/admin/events
// @desc    Get all events (admin view)
// @access  Admin only
router.get('/events', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      category,
      city,
      search,
      organizer
    } = req.query;

    const query = {};

    // Status filter
    if (status !== 'all') query.status = status;

    // Category filter
    if (category) query.category = category;

    // Location filter
    if (city) query['location.city'] = new RegExp(city, 'i');

    // Organizer filter
    if (organizer) {
      const organizerDoc = await Organizer.findOne({ name: new RegExp(organizer, 'i') });
      if (organizerDoc) {
        query.organizerId = organizerDoc._id;
      }
    }

    // Text search
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const events = await Event.find(query)
      .populate('organizerId', 'name email isVerified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
    console.error('Admin get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// @route   PUT /api/admin/events/:id/feature
// @desc    Feature/unfeature an event
// @access  Admin only
router.put('/events/:id/feature', authenticateToken, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.featured = !event.featured;
    await event.save();

    res.json({
      success: true,
      message: `Event ${event.featured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        id: event._id,
        featured: event.featured
      }
    });

  } catch (error) {
    console.error('Admin feature event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// @route   PUT /api/admin/events/:id/status
// @desc    Update event status
// @access  Admin only
router.put('/events/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be one of: draft, published, cancelled, completed'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.status = status;
    await event.save();

    res.json({
      success: true,
      message: 'Event status updated successfully',
      data: {
        id: event._id,
        status: event.status
      }
    });

  } catch (error) {
    console.error('Admin update event status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event status',
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete any event
// @access  Admin only
router.delete('/events/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Update organizer's total events count
    await Organizer.findByIdAndUpdate(
      event.organizerId,
      { $inc: { totalEvents: -1 } }
    );

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// @route   GET /api/admin/organizers
// @desc    Get all organizers
// @access  Admin only
router.get('/organizers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      verified,
      search
    } = req.query;

    const query = {};

    // Status filter
    if (status !== 'all') query.isActive = status === 'active';

    // Verification filter
    if (verified !== undefined) query.isVerified = verified === 'true';

    // Text search
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const organizers = await Organizer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get event counts for each organizer
    const organizersWithStats = await Promise.all(
      organizers.map(async (organizer) => {
        const eventCount = await Event.countDocuments({ organizerId: organizer._id });
        const activeEventCount = await Event.countDocuments({ 
          organizerId: organizer._id, 
          status: 'published',
          date: { $gte: new Date() }
        });
        
        return {
          ...organizer.toJSON(),
          stats: {
            totalEvents: eventCount,
            activeEvents: activeEventCount
          }
        };
      })
    );

    const total = await Organizer.countDocuments(query);

    res.json({
      success: true,
      data: organizersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Admin get organizers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizers',
      message: error.message
    });
  }
});

// @route   PUT /api/admin/organizers/:id/verify
// @desc    Verify/unverify organizer
// @access  Admin only
router.put('/organizers/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    organizer.isVerified = !organizer.isVerified;
    await organizer.save();

    res.json({
      success: true,
      message: `Organizer ${organizer.isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        id: organizer._id,
        isVerified: organizer.isVerified
      }
    });

  } catch (error) {
    console.error('Admin verify organizer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organizer',
      message: error.message
    });
  }
});

// @route   PUT /api/admin/organizers/:id/status
// @desc    Activate/deactivate organizer
// @access  Admin only
router.put('/organizers/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'isActive must be a boolean'
      });
    }

    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    organizer.isActive = isActive;
    await organizer.save();

    // If deactivating, also deactivate all their events
    if (!isActive) {
      await Event.updateMany(
        { organizerId: organizer._id },
        { status: 'cancelled' }
      );
    }

    res.json({
      success: true,
      message: `Organizer ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: organizer._id,
        isActive: organizer.isActive
      }
    });

  } catch (error) {
    console.error('Admin update organizer status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organizer',
      message: error.message
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Admin only
router.get('/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get overall stats
    const [
      totalEvents,
      totalOrganizers,
      totalUsers,
      activeEvents,
      featuredEvents,
      verifiedOrganizers
    ] = await Promise.all([
      Event.countDocuments(),
      Organizer.countDocuments(),
      Organizer.countDocuments({ isActive: true }),
      Event.countDocuments({ status: 'published', date: { $gte: new Date() } }),
      Event.countDocuments({ featured: true, status: 'published' }),
      Organizer.countDocuments({ isVerified: true })
    ]);

    // Get events by category
    const eventsByCategory = await Event.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get events by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const eventsByMonth = await Event.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top organizers by event count
    const topOrganizers = await Organizer.aggregate([
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
          isVerified: 1,
          eventCount: { $size: '$events' }
        }
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          totalOrganizers,
          totalUsers,
          activeEvents,
          featuredEvents,
          verifiedOrganizers
        },
        eventsByCategory,
        eventsByMonth,
        topOrganizers
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// @route   POST /api/admin/messages/send
// @desc    Send a message to organizers (broadcast or individual)
// @access  Admin only
router.post('/messages/send', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { message, type, recipients, title } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Message is required'
      });
    }

    const normalizedType = type === 'broadcast' ? 'broadcast' : 'individual';

    let organizerIds = [];
    if (normalizedType === 'broadcast') {
      const organizers = await Organizer.find({ isActive: true }).select('_id');
      organizerIds = organizers.map(o => o._id);
    } else {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Recipients are required for individual messages'
        });
      }

      organizerIds = recipients
        .filter(Boolean)
        .filter((id) => typeof id === 'string')
        .filter((id) => id.match(/^[0-9a-fA-F]{24}$/));

      if (organizerIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'No valid organizer recipient IDs provided'
        });
      }
    }

    const doc = await Message.create({
      type: normalizedType,
      title: title && typeof title === 'string' ? title.trim().slice(0, 120) : null,
      message: message.trim(),
      recipients: organizerIds.map((organizerId) => ({ organizerId })),
      createdBy: {
        uid: req.user?.uid || null,
        email: req.user?.email || null,
      }
    });

    if (normalizedType === 'broadcast') {
      await BroadcastNotification.create({
        title: title && typeof title === 'string' ? title.trim().slice(0, 120) : null,
        message: message.trim(),
        createdBy: {
          uid: req.user?.uid || null,
          email: req.user?.email || null,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: doc._id,
        type: doc.type,
        createdAt: doc.createdAt,
        recipientsCount: doc.recipients.length,
      }
    });
  } catch (error) {
    console.error('Admin send message error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// @route   GET /api/admin/messages/history
// @desc    Get message history (admin)
// @access  Admin only
router.get('/messages/history', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const safeLimit = Math.min(parseInt(limit) || 50, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const docs = await Message.find({})
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit);

    const total = await Message.countDocuments({});

    const data = docs.map((doc) => ({
      id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      createdAt: doc.createdAt,
      status: 'delivered',
      recipients: (doc.recipients || []).map((r) => String(r.organizerId)),
      recipientsCount: (doc.recipients || []).length,
      readCount: (doc.recipients || []).filter((r) => r.read).length,
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        current: safePage,
        pages: Math.ceil(total / safeLimit),
        total,
      }
    });
  } catch (error) {
    console.error('Admin message history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch message history',
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/messages/:id
// @desc    Delete a message from history
// @access  Admin only
router.delete('/messages/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required',
        message: 'Please provide a valid message ID'
      });
    }

    // Find and delete the message
    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        message: 'The message could not be found'
      });
    }

    console.log(`Admin deleted message: ${id}`);

    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        id: deletedMessage._id,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Admin delete message error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete message',
      message: error.message
    });
  }
});

module.exports = router;
