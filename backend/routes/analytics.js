const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Service = require('../models/Service');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Get dashboard overview
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get payment statistics
    const paymentQuery = {};
    if (req.user.role === 'customer') {
      paymentQuery.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      paymentQuery.serviceProvider = req.user.id;
    }

    const paymentStats = await Payment.aggregate([
      { $match: { ...paymentQuery, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get review statistics
    const reviewQuery = {};
    if (req.user.role === 'customer') {
      reviewQuery.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      reviewQuery.serviceProvider = req.user.id;
    }

    const reviewStats = await Review.aggregate([
      { $match: { ...reviewQuery, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get service statistics (for service providers)
    let serviceStats = null;
    if (req.user.role === 'service_provider') {
      serviceStats = await Service.aggregate([
        { $match: { provider: req.user.id } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        orders: {
          breakdown: orderStats,
          total: orderStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        payments: {
          totalRevenue: paymentStats[0]?.totalRevenue || 0,
          totalTransactions: paymentStats[0]?.count || 0
        },
        reviews: {
          averageRating: reviewStats[0]?.avgRating || 0,
          totalReviews: reviewStats[0]?.count || 0
        },
        services: serviceStats
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Get revenue analytics
router.get('/revenue', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const query = { status: 'completed' };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
        break;
      case 'month':
      default:
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
    }

    const revenueData = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgTransaction: { $avg: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics' });
  }
});

// Get order analytics
router.get('/orders', protect, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
        break;
      case 'month':
      default:
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
    }

    const orderData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: dateFormat,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        orderData,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order analytics' });
  }
});

// Get user analytics
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const userStats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyRegistrations = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          registrations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalUsers = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({ ...query, status: 'active' });

    res.json({
      success: true,
      data: {
        userStats,
        monthlyRegistrations,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user analytics' });
  }
});

// Get service analytics
router.get('/services', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by provider if not admin
    if (req.user.role === 'service_provider') {
      query.provider = req.user.id;
    }

    const serviceStats = await Service.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const availabilityStats = await Service.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$isAvailable',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalServices = await Service.countDocuments(query);
    const availableServices = await Service.countDocuments({ ...query, isAvailable: true });

    res.json({
      success: true,
      data: {
        serviceStats,
        availabilityStats,
        totalServices,
        availableServices,
        unavailableServices: totalServices - availableServices
      }
    });
  } catch (error) {
    console.error('Get service analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service analytics' });
  }
});

// Get review analytics
router.get('/reviews', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'approved' };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    const ratingDistribution = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const avgRating = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    const monthlyReviews = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          reviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalReviews = await Review.countDocuments(query);

    res.json({
      success: true,
      data: {
        ratingDistribution,
        averageRating: avgRating[0]?.avg || 0,
        monthlyReviews,
        totalReviews
      }
    });
  } catch (error) {
    console.error('Get review analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch review analytics' });
  }
});

// Top performing services (by orders and revenue)
router.get('/top-services', protect, async (req, res) => {
  try {
    const { timeRange, startDate, endDate, limit = 10 } = req.query;
    const query = {};

    // Support timeRange in days for convenience
    if (timeRange && !startDate && !endDate) {
      const days = parseInt(timeRange, 10);
      if (!isNaN(days) && days > 0) {
        query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    } else if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Aggregate from orders' items
    const results = await Order.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.serviceName',
          orders: { $sum: 1 },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit, 10) || 10 },
    ]);

    const topServices = results.map(r => ({
      name: r._id,
      orders: r.orders || 0,
      revenue: r.revenue || 0,
    }));

    res.json({ success: true, data: topServices });
  } catch (error) {
    console.error('Get top services error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top services' });
  }
});

// Get top performers
router.get('/top-performers', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Top service providers by revenue
    const topProviders = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: '$serviceProvider',
          totalRevenue: { $sum: '$amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'provider'
        }
      },
      { $unwind: '$provider' },
      {
        $project: {
          provider: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            businessDetails: 1
          },
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Top customers by spending
    const topCustomers = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customer: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1
          },
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topProviders,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top performers' });
  }
});

// Main analytics endpoint for admin dashboard
router.get('/', protect, admin, async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    
    // Calculate date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get total revenue
    const totalRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get total orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get total customers
    const totalCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get total service providers
    const totalProviders = await User.countDocuments({
      role: 'service_provider',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate average order value
    const avgOrderValue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, avg: { $avg: '$amount' } } }
    ]);

    // Calculate completion rate
    const completedOrders = await Order.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate customer satisfaction
    const satisfactionData = await Review.aggregate([
      { 
        $match: { 
          status: 'approved',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    // Get top services
    const topServices = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.service',
          orders: { $sum: 1 },
          revenue: { $sum: '$items.price' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $project: {
          name: '$service.name',
          orders: 1,
          revenue: 1
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customer', 'firstName lastName')
    .lean();

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order._id,
      customerName: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
      amount: order.totalAmount,
      status: order.status,
      date: order.createdAt
    }));

    // Get monthly revenue data
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalCustomers,
      totalProviders,
      averageOrderValue: avgOrderValue[0]?.avg || 0,
      completionRate: Math.round(completionRate * 10) / 10,
      customerSatisfaction: Math.round((satisfactionData[0]?.avg || 0) * 10) / 10,
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item._id,
        revenue: item.revenue
      })),
      topServices: topServices.map(service => ({
        name: service.name,
        orders: service.orders,
        revenue: service.revenue
      })),
      recentOrders: formattedRecentOrders
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics data' });
  }
});

module.exports = router; 