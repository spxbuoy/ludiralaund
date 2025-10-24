const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, admin, serviceProvider } = require('../middleware/auth');

// Get all reviews (with filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      serviceProviderId, 
      customerId,
      status = 'approved' 
    } = req.query;
    
    const query = {};

    // Filter by rating
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Filter by service provider
    if (serviceProviderId) {
      query.serviceProvider = serviceProviderId;
    }

    // Filter by customer
    if (customerId) {
      query.customer = customerId;
    }

    // Filter by status (admin can see all, others see only approved)
    if (req.user?.role === 'admin') {
      if (status) query.status = status;
    } else {
      query.status = 'approved';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'firstName lastName' },
        { path: 'serviceProvider', select: 'firstName lastName businessDetails' },
        { path: 'order', select: 'orderNumber service' }
      ],
      sort: { createdAt: -1 }
    };

    const reviews = await Review.paginate(query, options);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customer', 'firstName lastName')
      .populate('serviceProvider', 'firstName lastName businessDetails')
      .populate('order', 'orderNumber service');

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Check if user can view this review
    if (req.user?.role !== 'admin' && review.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch review' });
  }
});

// Create new review
router.post('/', protect, async (req, res) => {
  try {
    const {
      orderId,
      rating,
      comment,
      serviceQuality,
      timeliness,
      communication,
      valueForMoney
    } = req.body;

    // Validate required fields
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID and rating (1-5) are required' 
      });
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName')
      .populate('serviceProvider', 'firstName lastName businessDetails');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if user is the customer for this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only review completed orders' 
      });
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        error: 'Review already exists for this order' 
      });
    }

    const reviewData = {
      order: orderId,
      customer: order.customer._id,
      serviceProvider: order.serviceProvider._id,
      rating: parseInt(rating),
      comment: comment || '',
      serviceQuality: serviceQuality || rating,
      timeliness: timeliness || rating,
      communication: communication || rating,
      valueForMoney: valueForMoney || rating,
      status: 'pending' // Requires admin approval
    };

    const review = await Review.create(reviewData);
    await review.populate([
      { path: 'customer', select: 'firstName lastName' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' },
      { path: 'order', select: 'orderNumber service' }
    ]);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

// Update review (customer can update their own review)
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment, serviceQuality, timeliness, communication, valueForMoney } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && review.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Only allow updates if review is pending or approved
    if (review.status === 'rejected') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update rejected review' 
      });
    }

    const updateData = {};
    if (rating) updateData.rating = parseInt(rating);
    if (comment !== undefined) updateData.comment = comment;
    if (serviceQuality) updateData.serviceQuality = parseInt(serviceQuality);
    if (timeliness) updateData.timeliness = parseInt(timeliness);
    if (communication) updateData.communication = parseInt(communication);
    if (valueForMoney) updateData.valueForMoney = parseInt(valueForMoney);

    // Reset to pending if admin updates
    if (req.user.role === 'admin') {
      updateData.status = 'pending';
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'customer', select: 'firstName lastName' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' },
      { path: 'order', select: 'orderNumber service' }
    ]);

    res.json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
});

// Moderate review (admin only)
router.put('/:id/moderate', protect, admin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Validate status
    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be approved, rejected, or pending' 
      });
    }

    review.status = status;
    if (adminNotes) review.adminNotes = adminNotes;

    review.moderationHistory.push({
      status,
      moderatedBy: req.user.id,
      moderatedAt: new Date(),
      notes: adminNotes || ''
    });

    await review.save();
    await review.populate([
      { path: 'customer', select: 'firstName lastName' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' },
      { path: 'order', select: 'orderNumber service' }
    ]);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ success: false, error: 'Failed to moderate review' });
  }
});

// Delete review (admin or customer who created it)
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && review.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});

// Get reviews by service provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'firstName lastName' },
        { path: 'serviceProvider', select: 'firstName lastName businessDetails' },
        { path: 'order', select: 'orderNumber service' }
      ],
      sort: { createdAt: -1 }
    };

    const query = { 
      serviceProvider: req.params.providerId,
      status: req.user?.role === 'admin' ? { $in: ['approved', 'pending'] } : 'approved'
    };

    const reviews = await Review.paginate(query, options);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch provider reviews' });
  }
});

// Get review statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const { startDate, endDate, serviceProviderId } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (serviceProviderId) {
      query.serviceProvider = serviceProviderId;
    }

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    const stats = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const ratingStats = await Review.aggregate([
      { $match: { ...query, status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalReviews = await Review.countDocuments(query);
    const approvedReviews = await Review.countDocuments({ ...query, status: 'approved' });
    const pendingReviews = await Review.countDocuments({ ...query, status: 'pending' });

    const avgRating = await Review.aggregate([
      { $match: { ...query, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        ratingBreakdown: ratingStats,
        totalReviews,
        approvedReviews,
        pendingReviews,
        averageRating: avgRating[0]?.avg || 0
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch review statistics' });
  }
});

module.exports = router; 