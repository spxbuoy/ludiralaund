const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLoyaltyStatus,
  redeemPoints,
  awardPointsForReferral,
  awardPointsForReview
} = require('../services/loyaltyService');

// @desc    Get user's loyalty status
// @route   GET /api/loyalty/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const status = await getLoyaltyStatus(req.user._id);
    res.json(status);
  } catch (error) {
    console.error('Get loyalty status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Redeem loyalty points
// @route   POST /api/loyalty/redeem
// @access  Private
router.post('/redeem', protect, async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Valid points amount is required' });
    }

    const result = await redeemPoints(req.user._id, points);
    res.json(result);
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(400).json({ error: error.message });
  }
});

// @desc    Award points for referral (admin only)
// @route   POST /api/loyalty/referral
// @access  Private/Admin
router.post('/referral', protect, async (req, res) => {
  try {
    const { userId, description } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await awardPointsForReferral(userId, description);
    res.json(result);
  } catch (error) {
    console.error('Award referral points error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Award points for review
// @route   POST /api/loyalty/review
// @access  Private
router.post('/review', protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await awardPointsForReview(req.user._id, orderId);
    res.json(result);
  } catch (error) {
    console.error('Award review points error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;