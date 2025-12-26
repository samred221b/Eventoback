const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { optionalAdmin } = require('../middleware/admin');
const { validate, organizerSchemas } = require('../middleware/validation');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

const router = express.Router();

// @route   GET /api/organizers
// @desc    Get all organizers (public)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      country,
      verified,
      search
    } = req.query;

    const query = { isActive: true };

    // Add filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const organizers = await Organizer.find(query)
      .select('-firebaseUid -email -phone -socialLinks -lastLoginAt')
      .sort({ totalEvents: -1, rating: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Organizer.countDocuments(query);

    res.json({
      success: true,
      data: organizers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizers',
      message: error.message
    });
  }
});

// @route   GET /api/organizers/:id
// @desc    Get organizer by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .select('-firebaseUid -lastLoginAt')
      .populate({
        path: 'events',
        match: { status: 'published' },
        select: 'title date location category image attendeeCount',
        options: { sort: { date: 1 }, limit: 10 }
      });

    if (!organizer || !organizer.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    // Hide sensitive info if not the owner
    const isOwner = req.user && req.user.uid === organizer.firebaseUid;
    if (!isOwner) {
      organizer.email = undefined;
      organizer.phone = undefined;
      organizer.socialLinks = undefined;
    }

    res.json({
      success: true,
      data: organizer
    });

  } catch (error) {
    console.error('Get organizer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizer',
      message: error.message
    });
  }
});

// @route   PUT /api/organizers/profile
// @desc    Update organizer profile
// @access  Private
router.put('/profile', 
  authenticateToken, 
  validate(organizerSchemas.update), 
  async (req, res) => {
    try {
      const organizer = await Organizer.findByFirebaseUid(req.user.uid);

      if (!organizer) {
        return res.status(404).json({
          success: false,
          error: 'Organizer not found'
        });
      }

      // Update allowed fields
      const allowedUpdates = ['name', 'bio', 'phone', 'location', 'profileImage', 'socialLinks'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      Object.assign(organizer, updates);
      await organizer.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          bio: organizer.bio,
          phone: organizer.phone,
          location: organizer.location,
          profileImage: organizer.profileImage,
          socialLinks: organizer.socialLinks,
          updatedAt: organizer.updatedAt
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }
);

// @route   GET /api/organizers/profile/stats
// @desc    Get organizer statistics
// @access  Private
router.get('/profile/stats', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    // Get event statistics
    const eventStats = await Event.aggregate([
      { $match: { organizerId: organizer._id } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          upcomingEvents: {
            $sum: {
              $cond: [{ $gte: ['$date', new Date()] }, 1, 0]
            }
          },
          pastEvents: {
            $sum: {
              $cond: [{ $lt: ['$date', new Date()] }, 1, 0]
            }
          },
          totalViews: { $sum: '$views' },
          totalAttendees: { $sum: { $size: '$attendees' } },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      }
    ]);

    const stats = eventStats[0] || {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      totalViews: 0,
      totalAttendees: 0,
      totalLikes: 0
    };

    // Update organizer's total events count
    if (stats.totalEvents !== organizer.totalEvents) {
      organizer.totalEvents = stats.totalEvents;
      await organizer.save();
    }

    res.json({
      success: true,
      data: {
        organizer: {
          id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          isVerified: organizer.isVerified,
          rating: organizer.rating,
          createdAt: organizer.createdAt
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get organizer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// @route   GET /api/organizers/profile/events
// @desc    Get organizer's events
// @access  Private
router.get('/profile/events', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      category,
      search
    } = req.query;

    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    const query = { organizerId: organizer._id };

    // Add filters
    if (status !== 'all') query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// @route   DELETE /api/organizers/profile
// @desc    Deactivate organizer account
// @access  Private
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    // Soft delete - deactivate account
    organizer.isActive = false;
    organizer.email = `deactivated_${Date.now()}_${organizer.email}`;
    await organizer.save();

    // Also deactivate all their events
    await Event.updateMany(
      { organizerId: organizer._id },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate account',
      message: error.message
    });
  }
});

// @route   GET /api/organizers/:id/admin-details
// @desc    Get organizer details with admin information (admin only)
// @access  Admin only
router.get('/:id/admin-details', authenticateToken, optionalAdmin, async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    const organizer = await Organizer.findById(req.params.id)
      .select('-firebaseUid')
      .populate({
        path: 'events',
        select: 'title date location category image status attendeeCount',
        options: { sort: { date: -1 }, limit: 20 }
      });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }

    // Get detailed statistics
    const [
      totalEvents,
      activeEvents,
      pastEvents,
      cancelledEvents,
      totalAttendees,
      totalViews,
      totalLikes
    ] = await Promise.all([
      Event.countDocuments({ organizerId: organizer._id }),
      Event.countDocuments({ 
        organizerId: organizer._id, 
        status: 'published',
        date: { $gte: new Date() }
      }),
      Event.countDocuments({ 
        organizerId: organizer._id, 
        status: 'published',
        date: { $lt: new Date() }
      }),
      Event.countDocuments({ 
        organizerId: organizer._id, 
        status: 'cancelled'
      }),
      Event.aggregate([
        { $match: { organizerId: organizer._id } },
        { $project: { attendeeCount: { $size: '$attendees' } } },
        { $group: { _id: null, total: { $sum: '$attendeeCount' } } }
      ]),
      Event.aggregate([
        { $match: { organizerId: organizer._id } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Event.aggregate([
        { $match: { organizerId: organizer._id } },
        { $project: { likeCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likeCount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ...organizer.toJSON(),
        adminStats: {
          totalEvents,
          activeEvents,
          pastEvents,
          cancelledEvents,
          totalAttendees: totalAttendees[0]?.total || 0,
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get organizer admin details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizer details',
      message: error.message
    });
  }
});

module.exports = router;
