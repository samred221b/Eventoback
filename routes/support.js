const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const SupportRequest = require('../models/BugReport');
const Message = require('../models/Message');

const router = express.Router();

// @route   POST /api/support/bug-report
// @desc    Submit a bug report and send to admin
// @access  Public (with optional auth)
router.post('/bug-report', async (req, res) => {
  try {
    const { title, description, email, category } = req.body || {};

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Bug title is required'
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Bug description is required'
      });
    }

    const validCategories = ['general', 'crash', 'ui', 'performance', 'feature'];
    const normalizedCategory = validCategories.includes(category) ? category : 'general';

    // Get user info from optional auth
    let user = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Simple token validation for development
        if (token && token.length > 10) {
          user = { uid: 'dev-user', email: 'dev@example.com' };
        }
      }
    } catch (error) {
      // Ignore auth errors - proceed with anonymous submission
    }

    // Create support request record
    const supportRequest = await SupportRequest.create({
      type: 'bug',
      title: title.trim(),
      description: description.trim(),
      email: email && typeof email === 'string' ? email.trim().toLowerCase() : null,
      category: normalizedCategory,
      appVersion: '1.0.2',
      platform: 'mobile',
      submittedBy: {
        uid: user?.uid || null,
        email: user?.email || null,
      },
    });

    // Create admin-only message
    const messageTitle = `🐛 Bug Report: ${title.trim()}`;
    const messageContent = `
Category: ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}
Submitted: ${new Date().toLocaleDateString()}

Email: ${email || 'Not provided'}
User: ${user?.email || 'Anonymous user'}

Description:
${description.trim()}
    `.trim();

    // Create message for admin (no recipients = admin only)
    await Message.create({
      type: 'admin', // New type for admin-only messages
      title: messageTitle,
      message: messageContent,
      recipients: [], // Empty recipients means admin-only
      createdBy: {
        uid: user?.uid || null,
        email: user?.email || null,
      },
      metadata: {
        supportRequestId: supportRequest._id,
        requestType: 'bug',
        category: normalizedCategory,
        submittedBy: email || 'Anonymous',
      },
    });

    return res.json({
      success: true,
      message: 'Bug report submitted successfully',
      data: {
        id: supportRequest._id,
        title: supportRequest.title,
        category: supportRequest.category,
        status: supportRequest.status,
        submittedAt: supportRequest.createdAt,
      }
    });

  } catch (error) {
    console.error('Bug report submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit bug report',
      message: error.message
    });
  }
});

// @route   POST /api/support/feature-request
// @desc    Submit a feature request and send to admin
// @access  Public (with optional auth)
router.post('/feature-request', async (req, res) => {
  try {
    const { title, description, email, category } = req.body || {};

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Feature request title is required'
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Feature request description is required'
      });
    }

    const validCategories = ['general', 'crash', 'ui', 'performance', 'feature'];
    const normalizedCategory = validCategories.includes(category) ? category : 'general';

    // Get user info from optional auth
    let user = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Simple token validation for development
        if (token && token.length > 10) {
          user = { uid: 'dev-user', email: 'dev@example.com' };
        }
      }
    } catch (error) {
      // Ignore auth errors - proceed with anonymous submission
    }

    // Create support request record
    const supportRequest = await SupportRequest.create({
      type: 'feature',
      title: title.trim(),
      description: description.trim(),
      email: email && typeof email === 'string' ? email.trim().toLowerCase() : null,
      category: normalizedCategory,
      appVersion: '1.0.2',
      platform: 'mobile',
      submittedBy: {
        uid: user?.uid || null,
        email: user?.email || null,
      },
    });

    // Create admin-only message
    const messageTitle = `💡 Feature Request: ${title.trim()}`;
    const messageContent = `
Category: ${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)}
Submitted: ${new Date().toLocaleDateString()}

Email: ${email || 'Not provided'}
User: ${user?.email || 'Anonymous user'}

Description:
${description.trim()}
    `.trim();

    // Create message for admin (no recipients = admin only)
    await Message.create({
      type: 'admin', // New type for admin-only messages
      title: messageTitle,
      message: messageContent,
      recipients: [], // Empty recipients means admin-only
      createdBy: {
        uid: user?.uid || null,
        email: user?.email || null,
      },
      metadata: {
        supportRequestId: supportRequest._id,
        requestType: 'feature',
        category: normalizedCategory,
        submittedBy: email || 'Anonymous',
      },
    });

    return res.json({
      success: true,
      message: 'Feature request submitted successfully',
      data: {
        id: supportRequest._id,
        title: supportRequest.title,
        category: supportRequest.category,
        status: supportRequest.status,
        submittedAt: supportRequest.createdAt,
      }
    });

  } catch (error) {
    console.error('Feature request submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feature request',
      message: error.message
    });
  }
});

// @route   GET /api/support/requests
// @desc    Get all support requests (admin only)
// @access  Admin only
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (simple check for now - you may want to use admin middleware)
    if (req.user?.email !== 'samred221b@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    const { page = 1, limit = 20, status, category, type } = req.query;

    const query = {};
    
    // Type filter (bug or feature)
    if (type && ['bug', 'feature'].includes(type)) {
      query.type = type;
    }

    // Status filter
    if (status && ['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
      query.status = status;
    }

    // Category filter
    if (category && ['general', 'crash', 'ui', 'performance', 'feature'].includes(category)) {
      query.category = category;
    }

    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const supportRequests = await SupportRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit);

    const total = await SupportRequest.countDocuments(query);

    return res.json({
      success: true,
      data: supportRequests,
      pagination: {
        current: safePage,
        pages: Math.ceil(total / safeLimit),
        total,
      }
    });

  } catch (error) {
    console.error('Get support requests error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support requests',
      message: error.message
    });
  }
});

// @route   PUT /api/support/requests/:id/status
// @desc    Update support request status (admin only)
// @access  Admin only
router.put('/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.email !== 'samred221b@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be one of: pending, in-progress, resolved, closed'
      });
    }

    const supportRequest = await SupportRequest.findById(id);
    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        error: 'Support request not found'
      });
    }

    supportRequest.status = status;
    await supportRequest.save();

    return res.json({
      success: true,
      message: 'Support request status updated successfully',
      data: {
        id: supportRequest._id,
        type: supportRequest.type,
        status: supportRequest.status,
        updatedAt: supportRequest.updatedAt,
      }
    });

  } catch (error) {
    console.error('Update support request status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update support request status',
      message: error.message
    });
  }
});

module.exports = router;
