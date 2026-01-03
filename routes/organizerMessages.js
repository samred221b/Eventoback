const express = require('express');
const mongoose = require('mongoose');

const { authenticateToken } = require('../middleware/auth');
const Organizer = require('../models/Organizer');
const Message = require('../models/Message');

const router = express.Router();

// GET /api/organizer/messages
// Get messages for the authenticated organizer
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found',
      });
    }

    const docs = await Message.find({ 'recipients.organizerId': organizer._id })
      .sort({ createdAt: -1 })
      .limit(200);

    const data = docs.map((doc) => {
      const recipient = (doc.recipients || []).find(
        (r) => String(r.organizerId) === String(organizer._id)
      );

      return {
        id: doc._id,
        type: doc.type,
        title: doc.title,
        message: doc.message,
        createdAt: doc.createdAt,
        read: recipient?.read ?? false,
        readAt: recipient?.readAt ?? null,
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get organizer messages error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message,
    });
  }
});

// PUT /api/organizer/messages/:id/read
// Mark a specific message as read for the authenticated organizer
router.put('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message id',
      });
    }

    const organizer = await Organizer.findByFirebaseUid(req.user.uid);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found',
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    const recipientIdx = (message.recipients || []).findIndex(
      (r) => String(r.organizerId) === String(organizer._id)
    );

    if (recipientIdx === -1) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Message does not belong to this organizer',
      });
    }

    if (!message.recipients[recipientIdx].read) {
      message.recipients[recipientIdx].read = true;
      message.recipients[recipientIdx].readAt = new Date();
      await message.save();
    }

    return res.json({
      success: true,
      message: 'Message marked as read',
      data: {
        id: message._id,
        read: true,
        readAt: message.recipients[recipientIdx].readAt,
      },
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark as read',
      message: error.message,
    });
  }
});

module.exports = router;
