const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const BroadcastNotification = require('../models/BroadcastNotification');
const NotificationReceipt = require('../models/NotificationReceipt');

const router = express.Router();

// @route   GET /api/notifications/broadcast
// @desc    Get broadcast notifications (public, with optional auth to include read state)
// @access  Public
router.get('/broadcast', optionalAuth, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 30, 100);

    const notifications = await BroadcastNotification.find({})
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    const userId = req.user?.uid;
    if (!userId) {
      return res.json({
        success: true,
        data: notifications.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          isRead: false,
        })),
      });
    }

    const ids = notifications.map((n) => n._id);
    const receipts = await NotificationReceipt.find({
      userId,
      notificationId: { $in: ids },
      readAt: { $ne: null },
    }).select('notificationId');

    const readSet = new Set(receipts.map((r) => String(r.notificationId)));

    return res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        isRead: readSet.has(String(n._id)),
      })),
    });
  } catch (error) {
    console.error('Get broadcast notifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message,
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread broadcast notifications count for current user
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Not authenticated',
      });
    }

    const total = await BroadcastNotification.countDocuments({});
    if (total === 0) {
      return res.json({ success: true, data: { unreadCount: 0 } });
    }

    const readCount = await NotificationReceipt.countDocuments({
      userId,
      readAt: { $ne: null },
    });

    const unreadCount = Math.max(0, total - readCount);

    return res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Get unread notifications count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      message: error.message,
    });
  }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a broadcast notification as read for current user
// @access  Private
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Not authenticated',
      });
    }

    const notificationId = req.params.id;
    const exists = await BroadcastNotification.findById(notificationId).select('_id');
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    await NotificationReceipt.updateOne(
      { notificationId, userId },
      { $set: { readAt: new Date() } },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message,
    });
  }
});

// @route   POST /api/notifications/read-all
// @desc    Mark all broadcast notifications as read for current user
// @access  Private
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Not authenticated',
      });
    }

    // Get all notification IDs
    const notifications = await BroadcastNotification.find({}).select('_id');
    const notificationIds = notifications.map(n => n._id);

    if (notificationIds.length === 0) {
      return res.json({
        success: true,
        message: 'No notifications to mark as read',
      });
    }

    // Mark all notifications as read for this user
    const bulkOps = notificationIds.map(notificationId => ({
      updateOne: {
        filter: { notificationId, userId },
        update: { $set: { readAt: new Date() } },
        upsert: true,
      },
    }));

    await NotificationReceipt.bulkWrite(bulkOps);

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message,
    });
  }
});

module.exports = router;
