const express = require('express');
const Banner = require('../models/Banner');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/banners
// @desc    Get active banners sorted by order
// @access  Public
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch banners', message: error.message });
  }
});

// @route   GET /api/banners/all
// @desc    Get all banners (active and inactive) sorted by order for management
// @access  Admin only
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch all banners', message: error.message });
  }
});

// @route   POST /api/banners
// @desc    Create a new banner
// @access  Admin only
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, actionType = 'none', actionTarget, order = 0, isActive = true } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl is required' });
    }

    const banner = new Banner({ title, subtitle, imageUrl, actionType, actionTarget, order, isActive });
    await banner.save();

    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ success: false, error: 'Failed to create banner', message: error.message });
  }
});

// @route   PUT /api/banners/:id
// @desc    Update a banner
// @access  Admin only
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    Object.assign(banner, req.body);
    await banner.save();

    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, error: 'Failed to update banner', message: error.message });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Delete a banner
// @access  Admin only
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete banner', message: error.message });
  }
});

module.exports = router;
