const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect, admin, serviceProvider } = require('../middleware/auth');
const momoService = require('../services/momoService');

// Get all payments (with filtering)
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentMethod, 
      startDate, 
      endDate,
      userId 
    } = req.query;
    
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by user
    // Admins can filter by userId, others are restricted to their own payments
    if (req.user.role === 'admin') {
      if (userId) {
        query.$or = [{ customer: userId }, { serviceProvider: userId }]; // Admin can filter by a specific user ID
      }
    } else {
      // Non-admins can only see their own payments
      query.$or = [{ customer: req.user.id }, { serviceProvider: req.user.id }];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'order', select: 'orderNumber status totalAmount' },
        { path: 'customer', select: 'firstName lastName email' },
        { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
      ],
      sort: { createdAt: -1 }
    };

    const payments = await Payment.paginate(query, options);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});


// Create payment for order
router.post('/', protect, async (req, res) => {
  try {
    const {
      orderId,
      amount,
      paymentMethod,
      paymentDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID, amount, and payment method are required' 
      });
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName email')
      .populate('serviceProvider', 'firstName lastName businessDetails');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if user is the customer for this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment already exists for this order' 
      });
    }

    const paymentData = {
      order: orderId,
      customer: order.customer._id,
      serviceProvider: order.serviceProvider ? order.serviceProvider._id : undefined,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDetails: paymentDetails || {},
      status: 'pending',
      notes: notes || ''
    };

    const payment = await Payment.create(paymentData);
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Update payment status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, transactionId, notes } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions (admin or service provider)
    if (req.user.role !== 'admin' && payment.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: ['pending'],
      cancelled: []
    };

    if (!validTransitions[payment.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status transition from ${payment.status} to ${status}` 
      });
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (notes) payment.notes = notes;

    payment.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: notes || ''
    });

    await payment.save();
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment status' });
  }
});

// Process payment (simulate payment processing)
router.post('/:id/process', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && payment.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment is not in pending status' 
      });
    }

    // Simulate payment processing
    payment.status = 'processing';
    payment.processedAt = new Date();
    payment.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate processing delay
    setTimeout(async () => {
      payment.status = 'completed';
      payment.completedAt = new Date();
      
      payment.statusHistory.push({
        status: 'completed',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Payment processed successfully'
      });

      await payment.save();
    }, 2000);

    await payment.save();
    await payment.populate([
      { path: 'order', select: 'orderNumber status totalAmount' },
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'serviceProvider', select: 'firstName lastName businessDetails' }
    ]);

    res.json({
      success: true,
      data: payment,
      message: 'Payment processing started'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// Get payment statistics
router.get('/stats/overview', protect, async (req, res) => {
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

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments(query);
    const totalRevenue = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ ...query, status: 'pending' });
    const completedPayments = await Payment.countDocuments({ ...query, status: 'completed' });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        completedPayments
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment statistics' });
  }
});

// Process MoMo payment - This route is being replaced/modified
// The original logic for MoMo payment initiation was here, but the prompt asks for a new route
// at /:id/process-momo. This block will be removed or modified based on the new structure.
/*
router.post('/:id/momo', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (payment.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Payment is not in pending status'
      });
    }

    if (payment.paymentMethod !== 'momo') {
      return res.status(400).json({
        success: false,
        error: 'Payment method is not Mobile Money'
      });
    }

    // Validate phone number
    if (!phoneNumber || !momoService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number is required'
      });
    }

    const formattedPhone = momoService.formatPhoneNumber(phoneNumber);

    // Initiate MoMo payment
    const momoResult = await momoService.initiatePayment({
      amount: payment.amount,
      phoneNumber: formattedPhone,
      customerName: `${payment.customer.firstName} ${payment.customer.lastName}`,
      orderId: payment.order._id
    });

    // Update payment with MoMo details
    payment.paymentDetails = {
      phoneNumber: formattedPhone,
      transactionRef: momoResult.transactionRef,
      momoStatus: momoResult.status
    };

    // ... rest of the status update logic ...

    await payment.save();

    // ... response logic ...

  } catch (error) { ... }
});
*/

// Process MoMo payment for a specific payment ID
router.post('/:id/momo', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions: Only the customer associated with the payment can initiate MoMo
    const customerId = (payment.customer && payment.customer._id)
      ? payment.customer._id.toString()
      : payment.customer.toString();
    if (customerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if the payment is in 'pending' status
    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: `Payment is not in pending status. Current status: ${payment.status}`
      });
    }

    if (payment.paymentMethod !== 'momo') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method is not Mobile Money' 
      });
    }

    // Validate phone number
    if (!phoneNumber) {
         return res.status(400).json({
             success: false,
             error: 'Phone number is required for MoMo payment.'
         });
    }
    if (!momoService.validatePhoneNumber(phoneNumber)) {
         return res.status(400).json({
             success: false,
             error: 'Invalid phone number format.'
         });
    }    

    const formattedPhone = momoService.formatPhoneNumber(phoneNumber);

    // Initiate MoMo payment
    const momoResult = await momoService.initiatePayment({
      amount: payment.amount,
      phoneNumber: formattedPhone,
      customerName: `${payment.customer.firstName} ${payment.customer.lastName}`,
      orderId: payment.order._id
    });

    // Update payment with MoMo details
    payment.paymentDetails = {
      phoneNumber: formattedPhone,
      transactionRef: momoResult.transactionRef,
      momoStatus: momoResult.status,
      // Store other relevant details returned by the service
      ...momoResult.details 
    };

    // Update payment status based on the initial MoMo service response
    if (momoResult.success) {
      if (momoResult.status === 'completed') {
        payment.status = 'completed';
        payment.transactionId = momoResult.transactionId;
        payment.completedAt = new Date();
        // Add to history
        payment.statusHistory.push({
            status: 'completed',
            changedBy: req.user.id, // Assuming the user initiated this change
            changedAt: new Date(),
            notes: 'MoMo payment completed successfully (initial callback)'
        });
      } else if (momoResult.status === 'pending') {
        payment.status = 'processing';
        payment.processedAt = new Date();
         // Add to history
      }
    } else {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = momoResult.message;
    }

    await payment.save();

    res.json({
      success: momoResult.success,
      data: payment,
      message: momoResult.message,
      momoDetails: {
        transactionRef: momoResult.transactionRef,
        status: momoResult.status,
        paymentUrl: momoResult.paymentUrl
      }
    });
  } catch (error) {
    console.error('MoMo payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to process MoMo payment' });
  }
});

// Check MoMo payment status
router.get('/:id/momo/status', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (payment.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (payment.paymentMethod !== 'momo' || !payment.paymentDetails?.transactionRef) {
      return res.status(400).json({ 
        success: false, 
        error: 'No MoMo transaction found for this payment' 
      });
    }

    // Check status with MoMo service
    const statusResult = await momoService.checkPaymentStatus(payment.paymentDetails.transactionRef);

    // Update payment status if changed
    if (statusResult.success && statusResult.status !== payment.paymentDetails.momoStatus) {
      payment.paymentDetails.momoStatus = statusResult.status;
      
      if (statusResult.status === 'completed' && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.transactionId = statusResult.transactionId;
        payment.completedAt = new Date();
      } else if (statusResult.status === 'failed' && payment.status !== 'failed') {
        payment.status = 'failed';
        payment.failedAt = new Date();
        payment.failureReason = statusResult.message;
      }

      await payment.save();
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        momoStatus: statusResult.status,
        transactionRef: payment.paymentDetails.transactionRef,
        message: statusResult.message
      }
    });
  } catch (error) {
    console.error('MoMo status check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check MoMo payment status' });
  }
});

// Get payment methods
router.get('/methods/list', async (req, res) => {
  try {
    const paymentMethods = [
      { id: 'credit_card', name: 'Credit Card', icon: 'credit_card' },
      { id: 'debit_card', name: 'Debit Card', icon: 'credit_card' },
      { id: 'bank_transfer', name: 'Bank Transfer', icon: 'account_balance' },
      { id: 'cash', name: 'Cash', icon: 'attach_money' },
      { id: 'digital_wallet', name: 'Digital Wallet', icon: 'account_balance_wallet' },
      { id: 'momo', name: 'Mobile Money', icon: 'phone_android' }
    ];
    
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment methods' });
  }
});

// Get payment history with advanced filtering and search
router.get('/history', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }
    // Admins can see all payments (no additional filter)

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { transactionId: searchRegex },
        { notes: searchRegex },
        { 'paymentDetails.transactionRef': searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        {
          path: 'order',
          select: 'orderNumber status totalAmount items pickupDate deliveryDate',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        },
        { path: 'customer', select: 'firstName lastName email phoneNumber' },
        { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
        {
          path: 'statusHistory.changedBy',
          select: 'firstName lastName email'
        }
      ],
      sort: sortOptions
    };

    const payments = await Payment.paginate(query, options);

    // Add formatted data for frontend
    const formattedPayments = {
      ...payments,
      docs: payments.docs.map(payment => ({
        ...payment.toObject(),
        formattedAmount: `¢${payment.amount.toFixed(2)}`,
        formattedDate: payment.createdAt,
        orderInfo: payment.order ? {
          orderNumber: payment.order.orderNumber || `ORD-${payment.order._id.toString().slice(-6).toUpperCase()}`,
          status: payment.order.status,
          totalAmount: payment.order.totalAmount,
          itemCount: payment.order.items ? payment.order.items.length : 0
        } : null
      }))
    };

    res.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

// Export payment history to CSV
router.get('/history/export', protect, async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      format = 'csv'
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    // Apply filters
    if (status && status !== 'all') query.status = status;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email')
      .populate('serviceProvider', 'firstName lastName businessDetails')
      .sort({ createdAt: -1 })
      .limit(1000); // Limit for performance

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = 'Transaction ID,Order Number,Customer,Amount,Payment Method,Status,Date,Transaction Ref\n';
      const csvRows = payments.map(payment => {
        const customerName = payment.customer ? `${payment.customer.firstName} ${payment.customer.lastName}` : 'N/A';
        const orderNumber = payment.order ? (payment.order.orderNumber || `ORD-${payment.order._id.toString().slice(-6).toUpperCase()}`) : 'N/A';
        const transactionRef = payment.paymentDetails?.transactionRef || payment.transactionId || 'N/A';

        return `"${payment._id}","${orderNumber}","${customerName}","¢${payment.amount.toFixed(2)}","${payment.paymentMethod}","${payment.status}","${payment.createdAt.toISOString()}","${transactionRef}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-history-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    }
  } catch (error) {
    console.error('Export payment history error:', error);
    res.status(500).json({ success: false, error: 'Failed to export payment history' });
  }
});

// Get payment receipt
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'order',
        select: 'orderNumber status totalAmount items pickupDate deliveryDate pickupAddress deliveryAddress',
        populate: {
          path: 'customer',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' &&
        payment.customer._id.toString() !== req.user.id &&
        payment.serviceProvider?._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Generate receipt data
    const receiptData = {
      payment: {
        id: payment._id,
        transactionId: payment.transactionId || payment.paymentDetails?.transactionRef || 'N/A',
        amount: payment.amount,
        formattedAmount: `¢${payment.amount.toFixed(2)}`,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        refundAmount: payment.refundAmount || 0
      },
      order: payment.order ? {
        orderNumber: payment.order.orderNumber || `ORD-${payment.order._id.toString().slice(-6).toUpperCase()}`,
        status: payment.order.status,
        totalAmount: payment.order.totalAmount,
        items: payment.order.items || [],
        pickupDate: payment.order.pickupDate,
        deliveryDate: payment.order.deliveryDate,
        pickupAddress: payment.order.pickupAddress,
        deliveryAddress: payment.order.deliveryAddress
      } : null,
      customer: {
        name: `${payment.customer.firstName} ${payment.customer.lastName}`,
        email: payment.customer.email,
        phone: payment.customer.phoneNumber
      },
      serviceProvider: payment.serviceProvider ? {
        name: `${payment.serviceProvider.firstName} ${payment.serviceProvider.lastName}`,
        email: payment.serviceProvider.email,
        phone: payment.serviceProvider.phoneNumber,
        business: payment.serviceProvider.businessDetails
      } : null,
      metadata: {
        generatedAt: new Date(),
        generatedBy: req.user.id
      }
    };

    res.json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    console.error('Get payment receipt error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate receipt' });
  }
});

// Get payment history statistics
router.get('/history/stats', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      statusStats,
      methodStats,
      totalStats,
      monthlyStats
    ] = await Promise.all([
      // Status breakdown
      Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),

      // Payment method breakdown
      Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),

      // Total statistics
      Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
              }
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            }
          }
        }
      ]),

      // Monthly trend (last 12 months)
      Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: statusStats,
        methodBreakdown: methodStats,
        totals: totalStats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          avgAmount: 0,
          completedAmount: 0,
          pendingAmount: 0
        },
        monthlyTrend: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get payment history stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment statistics' });
  }
});

// Get payment by ID (must be after specific routes like /history)
router.get('/:id([0-9a-fA-F]{24})', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber status totalAmount')
      .populate('customer', 'firstName lastName email')
      .populate('serviceProvider', 'firstName lastName businessDetails');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        payment.customer.toString() !== req.user.id && 
        payment.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

module.exports = router;
