const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin, serviceProvider, customer } = require('../middleware/auth');
const Payment = require('../models/Payment'); // Import Payment model
const OrderTracking = require('../models/OrderTracking'); // Import OrderTracking model
const { sendOrderStatusEmail } = require('../services/emailService'); // Import email service
const { awardPointsForOrder } = require('../services/loyaltyService'); // Import loyalty service

// Get all orders (with filtering)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, userId, include_available } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (role === 'customer') {
      query.customer = req.user.id;
    } else if (role === 'service_provider') {
      if (include_available === 'true') {
        // Include both assigned orders and available orders for self-assignment
        query.$or = [
          { serviceProvider: req.user.id },
          { 
            serviceProvider: null, 
            status: { $in: ['pending', 'confirmed'] } 
          }
        ];
      } else {
        query.serviceProvider = req.user.id;
      }
    }

    if (userId) {
      if (req.user.role === 'admin') {
        query.$or = [{ customer: userId }, { serviceProvider: userId }];
      } else {
        query.$or = [{ customer: req.user.id }, { serviceProvider: req.user.id }];
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'customer', select: 'firstName lastName email phoneNumber' },
 { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
        { path: 'payment' }, // Populate the payment details
 { path: 'payment' } // Populate the payment details
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(query, options);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
 .populate('payment') // Populate the payment details
 .populate('payment') // Populate the payment details
 .populate('customer', 'firstName lastName email phoneNumber')
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (req.user.role !== 'admin' &&
        order.customer.toString() !== req.user.id &&
        order.serviceProvider?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', protect, customer, async (req, res) => {
  try {
    console.log('Received order data:', req.body);

    const { STATIC_SERVICES } = require('../config/staticServices');

    const {
      items,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      deliveryDate,
      paymentMethod,
      specialInstructions,
      subtotal,
      tax,
      deliveryFee,
      momoPhone,
      momoNetwork,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required',
      });
    }

    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Pickup and delivery addresses are required',
      });
    }

    if (!pickupDate || !deliveryDate) {
      return res.status(400).json({
        success: false,
        error: 'Pickup and delivery dates are required',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required',
      });
    }

    // Validate service IDs exist in static services
    console.log('Available static services:', STATIC_SERVICES.map(s => ({ id: s._id, name: s.name })));

    for (const item of items) {
      console.log(`Checking service: ${item.service}`);
      if (!item.service) {
        console.log('Service ID is missing or null');
        return res.status(400).json({
          success: false,
          error: 'Service is required',
        });
      }

      const service = STATIC_SERVICES.find(s => s._id === item.service);
      if (!service) {
        console.log(`Service ${item.service} not found in static services`);
        console.log('Available service IDs:', STATIC_SERVICES.map(s => s._id));
        return res.status(400).json({
          success: false,
          error: `Service ${item.service} not found`,
        });
      }

      console.log(`Service ${item.service} found:`, service.name);
    }

    // Process items for the order document
    const processedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const service = STATIC_SERVICES.find(s => s._id === item.service);
      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || service.price || 0;

      // If clothingItems are provided, compute total from them and persist details
      let clothingItems = Array.isArray(item.clothingItems) ? item.clothingItems.map(ci => ({
        itemId: ci.itemId,
        description: ci.description,
        service: item.service,
        serviceName: item.serviceName || service.name,
        unitPrice: parseFloat(ci.unitPrice) || 0,
        specialInstructions: ci.specialInstructions || '',
        isConfirmed: !!ci.isConfirmed,
      })) : [];

      const totalPrice = clothingItems.length > 0
        ? clothingItems.reduce((sum, ci) => sum + (parseFloat(ci.unitPrice) || 0), 0)
        : (quantity * unitPrice);

      processedItems.push({
        service: item.service, // Store the static service ID as a string
        serviceName: item.serviceName || service.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        specialInstructions: item.specialInstructions || '',
        clothingItems: clothingItems,
      });

      calculatedSubtotal += totalPrice;
    }

    const finalSubtotal = parseFloat(subtotal) || calculatedSubtotal;
    const finalTax = parseFloat(tax) || finalSubtotal * 0.1; // Example tax calculation
    const finalDeliveryFee = parseFloat(deliveryFee) || 5; // Example delivery fee
    const finalTotal = finalSubtotal + finalTax + finalDeliveryFee;

    // Create order data
    const orderData = {
      customer: req.user.id,
      serviceProvider: null,
      items: processedItems,
      status: 'pending',
      subtotal: finalSubtotal,
      tax: finalTax,
      deliveryFee: finalDeliveryFee,
      totalAmount: finalTotal,
      pickupAddress: {
        type: pickupAddress.type || 'home',
        street: pickupAddress.street,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zipCode: pickupAddress.zipCode,
        instructions: pickupAddress.instructions || '',
      },
      deliveryAddress: {
        type: deliveryAddress.type || 'home',
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        instructions: deliveryAddress.instructions || '',
      },
      pickupDate: new Date(pickupDate),
      deliveryDate: new Date(deliveryDate),
      paymentMethod: paymentMethod || 'cash',
      notes: {
        customer: specialInstructions || '',
        serviceProvider: '',
        admin: '',
      },
      ...(paymentMethod === 'momo' && {
        momoPhone,
        momoNetwork,
      }),
    };

    console.log('Final order data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    // Create a new payment document for the order
    const paymentData = {
      order: order._id,
      customer: req.user.id,
      serviceProvider: order.serviceProvider, // Can be null initially
      amount: order.totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentDetails: orderData.paymentMethod === 'momo' ? { phoneNumber: momoPhone, momoNetwork } : {},
      status: 'pending', // Initial payment status
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Payment initiated with order creation'
      }]
    };

    const payment = await Payment.create(paymentData);

    // Link the payment to the order
 order.payment = payment._id;
 await order.save();

    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
 { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
 { path: 'payment' } // Populate the payment details after linking
    ]);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

// Update order status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup', 'picked_up', 'ready_for_delivery', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status: ${status}` 
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'service_provider') {
      // Service providers can only update orders assigned to them
      if (!order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          error: 'You can only update orders assigned to you' 
        });
      }
    } else if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['assigned', 'in_progress', 'cancelled'],
      assigned: ['confirmed', 'in_progress', 'cancelled'],
      in_progress: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['picked_up', 'cancelled'],
      picked_up: ['ready_for_delivery', 'cancelled'],
      ready_for_delivery: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Store old status for email notification
    const oldStatus = order.status;
    
    // Update the order
    order.status = status;
    
    // Initialize statusHistory if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: req.body.notes || '',
    });

    await order.save();
    
    // Find or create OrderTracking document and update location/status
    let tracking = await OrderTracking.findOne({ order: order._id });
    if (!tracking) tracking = new OrderTracking({ order: order._id });

    // Map order status to tracking currentLocation enum
    const statusToTracking = {
      pending: 'pending',
      confirmed: 'pickup_scheduled',
      assigned: 'in_transit_to_facility',
      in_progress: 'cleaning',
      ready_for_pickup: 'at_facility',
      picked_up: 'picked_up',
      ready_for_delivery: 'ready_for_delivery',
      completed: 'delivered',
      cancelled: 'pending', // neutral fallback
    };
    const trackingLocation = statusToTracking[status] || 'pending';
    await tracking.updateLocation(trackingLocation, req.body.notes, req.user.id);
    // Populate the order with user details
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    // Send email notification to customer about status change
    try {
      const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
      const orderNumber = order.orderNumber;
      const allClothingItems = order.getAllClothingItems();

      await sendOrderStatusEmail(
        order.customer.email,
        customerName,
        orderNumber,
        oldStatus,
        status,
        allClothingItems
      );
      console.log(`📧 Status update email sent to ${order.customer.email} for order ${orderNumber}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send status update email:', emailError);
      // Don't fail the request if email fails
    }

    // Award loyalty points if order is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        const loyaltyResult = await awardPointsForOrder(order._id);
        if (loyaltyResult.success && loyaltyResult.pointsAwarded > 0) {
          console.log(`🎉 Awarded ${loyaltyResult.pointsAwarded} loyalty points to customer ${order.customer._id} for order ${order._id}`);
        }
      } catch (loyaltyError) {
        console.error('⚠️ Failed to award loyalty points:', loyaltyError);
        // Don't fail the request if loyalty points fail
      }
    }

    // Add formatted total for frontend (Ghana Cedis)
    const orderWithFormatted = {
      ...order.toObject(),
      formattedTotal: `¢${order.totalAmount.toFixed(2)}`
    };

    console.log(`Order ${order._id} status updated from ${oldStatus} to ${status} by user ${req.user.id}`);

    res.json({
      success: true,
      data: orderWithFormatted,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update order status' 
    });
  }
});


// Update order details (admin and service providers can update notes)
router.put('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'service_provider') {
      // Service providers can only update orders assigned to them and only notes
      if (order.serviceProvider && order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      // Only allow notes updates for service providers
      if (req.body.notes) {
        order.notes = { ...order.notes, ...req.body.notes };
      }
    } else if (req.user.role === 'admin') {
      // Admins can update everything
      Object.assign(order, req.body);
    } else {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await order.save();
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Assign order to a specific provider (admin only)
router.put('/:id/assign', protect, admin, async (req, res) => {
  try {
    const { serviceProviderId } = req.body;
    if (!serviceProviderId) {
      return res.status(400).json({ success: false, error: 'serviceProviderId is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Set provider and status
    order.serviceProvider = serviceProviderId;
    if (['pending', 'confirmed'].includes(order.status)) {
      order.status = 'assigned';
    }

    // Initialize and push status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: req.body.notes || 'Assigned by admin',
    });

    await order.save();

    // Update related payment document serviceProvider
    try {
      await Payment.updateOne({ order: order._id }, { $set: { serviceProvider: serviceProviderId } });
    } catch (e) {
      console.warn('Failed to update payment serviceProvider for order', order._id.toString());
    }

    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    const orderWithFormatted = {
      ...order.toObject(),
      formattedTotal: `¢${order.totalAmount.toFixed(2)}`,
    };

    return res.json({ success: true, data: orderWithFormatted, message: 'Order assigned successfully' });
  } catch (error) {
    console.error('Admin assign order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign order' });
  }
});

// Self-assign order (service providers only) - PATCH method
router.put('/:id/assign-self', protect, serviceProvider, async (req, res) => {
  try {
    console.log(`Service provider ${req.user.id} attempting to assign order ${req.params.id}`);
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log(`Order ${req.params.id} not found`);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    console.log(`Order status: ${order.status}, serviceProvider: ${order.serviceProvider}`);

    // Check if order is available for assignment
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        error: `Order is not available for assignment. Current status: ${order.status}` 
      });
    }

    // Check if order already has a service provider assigned
    if (order.serviceProvider) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order is already assigned to a service provider' 
      });
    }

    // Assign the order to the current service provider
    order.serviceProvider = req.user.id;
    order.status = 'assigned';

    // Initialize statusHistory if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: 'Self-assigned by service provider',
    });

    await order.save();
    
    // Populate the order with user details
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    // Add formatted total for frontend
    const orderWithFormatted = {
      ...order.toObject(),
      formattedTotal: `¢${order.totalAmount.toFixed(2)}`
    };

    console.log(`Order ${order._id} successfully assigned to service provider ${req.user.id}`);

    res.json({
      success: true,
      data: orderWithFormatted,
      message: 'Successfully assigned order to yourself',
    });
  } catch (error) {
    console.error('Self-assign order error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to assign order' 
    });
  }
});


// Self-assign order (service providers only) - PUT method
router.put('/:id/assign-self', protect, serviceProvider, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if order is available for assignment
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Order is not available for assignment' 
      });
    }

    // Check if order already has a service provider assigned
    if (order.serviceProvider) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order is already assigned to a service provider' 
      });
    }

    // Assign the order to the current service provider
    order.serviceProvider = req.user.id;
    order.status = 'assigned';

    await order.save();
    await order.populate([
      { path: 'customer', select: 'firstName lastName email phoneNumber' },
      { path: 'serviceProvider', select: 'firstName lastName email phoneNumber businessDetails' },
    ]);

    res.json({
      success: true,
      data: order,
      message: 'Successfully assigned to order',
    });
  } catch (error) {
    console.error('Self-assign order error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign order' });
  }
});

// Delete order (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

// Get order statistics
router.get('/stats-overview', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user.id;
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order statistics' });
  }
});

// GET /api/orders/provider/assigned - Get orders assigned to the service provider and available orders
router.get('/provider/assigned', protect, serviceProvider, async (req, res) => {
  try {
    console.log('Provider ID:', req.user.id);
    console.log('User role:', req.user.role);
    
    // Get both assigned orders and available orders for self-assignment
    const query = {
      $or: [
        { serviceProvider: req.user.id }, // Orders assigned to this provider
        { 
          serviceProvider: null, 
          status: { $in: ['pending', 'confirmed'] } 
        } // Available orders for self-assignment
      ]
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email phoneNumber')
      .populate('serviceProvider', 'firstName lastName email phoneNumber businessDetails')
      .populate('payment')
      .sort({ createdAt: -1 });

    console.log('Found orders count:', orders.length);

    // Format orders with consistent structure
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        formattedTotal: `¢${order.totalAmount.toFixed(2)}`,
        orderNumber: orderObj.orderNumber || `ORD-${orderObj._id.toString().slice(-6).toUpperCase()}`,
        notes: orderObj.notes || { customer: '', serviceProvider: '', admin: '' }
      };
    });

    console.log('Formatted orders sample:', formattedOrders.length > 0 ? {
      id: formattedOrders[0]._id,
      status: formattedOrders[0].status,
      serviceProvider: formattedOrders[0].serviceProvider ? 'assigned' : 'unassigned',
      customer: formattedOrders[0].customer?.firstName,
      total: formattedOrders[0].formattedTotal
    } : 'No orders found');

    res.json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length
    });
  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assigned orders'
    });
  }
});

// Update payment status for an order (helper route)
const updateOrderPaymentStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: ['pending'],
      cancelled: []
    };

    const order = await Order.findById(orderId).populate('payment');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // permission: admin or service_provider assigned to order
    if (req.user.role !== 'admin') {
      if (req.user.role !== 'service_provider' || !order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    let payment = null;
    if (order.payment?._id) {
      payment = await Payment.findById(order.payment._id);
    } else {
      payment = await Payment.findOne({ order: order._id });
    }
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found for order' });

    if (!validTransitions[payment.status] || !validTransitions[payment.status].includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status transition from ${payment.status} to ${status}` });
    }
    payment.status = status;
    payment.statusHistory.push({ status, changedBy: req.user.id, changedAt: new Date(), notes: req.body.notes || '' });
    await payment.save();

    return res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Update order payment status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update payment status' });
  }
};

// Support both PATCH and PUT for flexibility
router.patch('/:id/payment-status', protect, updateOrderPaymentStatusHandler);
router.put('/:id/payment-status', protect, updateOrderPaymentStatusHandler);

// Add individual clothing item to an existing order item
router.post('/:id/items/:itemIndex/clothing-items', protect, async (req, res) => {
  try {
    const { description, specialInstructions } = req.body;
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item description is required' 
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions: allow customer, admin, or assigned service provider
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    } else if (req.user.role === 'service_provider') {
      if (!order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'You can only add items to orders assigned to you' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (itemIndex >= order.items.length || itemIndex < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid item index' 
      });
    }

    const orderItem = order.items[itemIndex];
    const itemId = order.generateItemId();
    
    const clothingItem = {
      itemId,
      description,
      service: orderItem.service,
      serviceName: orderItem.serviceName,
      unitPrice: orderItem.unitPrice,
      specialInstructions: specialInstructions || '',
      isConfirmed: false
    };

    if (!orderItem.clothingItems) {
      orderItem.clothingItems = [];
    }
    orderItem.clothingItems.push(clothingItem);

    await order.save();

    res.status(201).json({
      success: true,
      data: clothingItem,
      message: `Clothing item added with ID: ${itemId}`
    });
  } catch (error) {
    console.error('Add clothing item error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to add clothing item' 
    });
  }
});

// Confirm/unconfirm clothing item (provider use)
router.patch('/:id/clothing-items/:itemId/confirm', protect, serviceProvider, async (req, res) => {
  try {
    const { confirmed = true } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check if provider is assigned to this order
    if (!order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only confirm items for orders assigned to you' 
      });
    }

    try {
      const clothingItem = order.confirmClothingItem(req.params.itemId, confirmed);
      await order.save();
      
      res.json({
        success: true,
        data: clothingItem,
        message: `Clothing item ${confirmed ? 'confirmed' : 'unconfirmed'}`
      });
    } catch (itemError) {
      return res.status(404).json({ 
        success: false, 
        error: itemError.message 
      });
    }
  } catch (error) {
    console.error('Confirm clothing item error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update clothing item confirmation' 
    });
  }
});

// Get all clothing items for an order
router.get('/:id/clothing-items', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    } else if (req.user.role === 'service_provider') {
      if (!order.serviceProvider || order.serviceProvider.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const allClothingItems = order.getAllClothingItems();
    
    res.json({
      success: true,
      data: allClothingItems,
      count: allClothingItems.length
    });
  } catch (error) {
    console.error('Get clothing items error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clothing items' 
    });
  }
});

module.exports = router;
