
const express = require('express');
const router = express.Router();
const OrderTracking = require('../models/OrderTracking');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Get tracking info for an order
router.get('/:orderId', protect, async (req, res) => {
  try {
    const tracking = await OrderTracking.findOne({ order: req.params.orderId })
      .populate('order', 'orderNumber status customer serviceProvider')
      .populate('trackingSteps.updatedBy', 'firstName lastName');

    if (!tracking) {
      return res.status(404).json({ success: false, error: 'Tracking information not found' });
    }

    // Check if user has access to this order
    const order = await Order.findById(req.params.orderId);
    if (req.user.role !== 'admin' && 
        order.customer.toString() !== req.user.id && 
        order.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: tracking });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tracking information' });
  }
});

// Update tracking location (service providers and admin only)
router.put('/:orderId/location', protect, async (req, res) => {
  try {
    const { status, notes, coordinates } = req.body;
    
    let tracking = await OrderTracking.findOne({ order: req.params.orderId });
    
    if (!tracking) {
      tracking = new OrderTracking({ order: req.params.orderId });
    }

    await tracking.updateLocation(status, notes, req.user.id);
    
    if (coordinates) {
      tracking.coordinates = {
        ...coordinates,
        lastUpdated: new Date()
      };
      await tracking.save();
    }

    // Emit real-time update
    req.app.get('io').to(`order_${req.params.orderId}`).emit('trackingUpdate', {
      orderId: req.params.orderId,
      status,
      timestamp: new Date(),
      coordinates
    });

    res.json({ success: true, data: tracking });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tracking' });
  }
});

module.exports = router;
