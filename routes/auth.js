const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserByUid } = require('../config/firebase');
const Organizer = require('../models/Organizer');

const router = express.Router();

// @route   POST /api/auth/verify
// @desc    Verify Firebase token and get/create user
// @access  Public
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    // Check if organizer exists in our database
    let organizer = await Organizer.findByFirebaseUid(uid);

    if (!organizer) {
      // Create new organizer if doesn't exist
      organizer = new Organizer({
        firebaseUid: uid,
        email: email,
        name: name || email.split('@')[0], // Use email prefix as default name
      });
      
      await organizer.save();
    } else {
      // Update last login
      await organizer.updateLastLogin();
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: organizer._id,
        firebaseUid: organizer.firebaseUid,
        name: organizer.name,
        email: organizer.email,
        bio: organizer.bio,
        phone: organizer.phone,
        location: organizer.location,
        profileImage: organizer.profileImage,
        isVerified: organizer.isVerified,
        totalEvents: organizer.totalEvents,
        rating: organizer.rating,
        createdAt: organizer.createdAt,
        lastLoginAt: organizer.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'Organizer profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: organizer._id,
        firebaseUid: organizer.firebaseUid,
        name: organizer.name,
        email: organizer.email,
        bio: organizer.bio,
        phone: organizer.phone,
        location: organizer.location,
        profileImage: organizer.profileImage,
        isVerified: organizer.isVerified,
        totalEvents: organizer.totalEvents,
        rating: organizer.rating,
        socialLinks: organizer.socialLinks,
        createdAt: organizer.createdAt,
        lastLoginAt: organizer.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh user session
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update last login
    await organizer.updateLastLogin();

    res.json({
      success: true,
      message: 'Session refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh session',
      message: error.message
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete - mark as inactive instead of deleting
    organizer.isActive = false;
    organizer.email = `deleted_${Date.now()}_${organizer.email}`;
    await organizer.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: error.message
    });
  }
});

module.exports = router;
