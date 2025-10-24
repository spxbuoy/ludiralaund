const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystackService');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Get Paystack public key for frontend
router.get('/config', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publicKey: paystackService.getPublicKey(),
        isTestMode: paystackService.isTestMode()
      }
    });
  } catch (error) {
    console.error('Get Paystack config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment configuration'
    });
  }
});

// Initialize payment for an order
router.post('/initialize/:orderId', protect, async (req, res) => {
  if (!process.env.APP_URL) {
    console.error('APP_URL environment variable is not set.');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: APP_URL is not defined.'
    });
  }

  try {
    const { orderId } = req.params;
    const { paymentMethod, momoPhone, momoProvider } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate('customer', 'firstName lastName email phoneNumber');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if payment already exists and is successful
    const existingPayment = await Payment.findOne({ 
      order: orderId, 
      status: { $in: ['completed', 'processing'] } 
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed for this order'
      });
    }

    // Generate unique reference
    const reference = paystackService.generateReference(`order_${orderId.slice(-6)}`);

    // Prepare payment channels based on payment method
    let channels = ['card', 'bank', 'ussd', 'qr'];
    let mobileMoneyData = {};

    if (paymentMethod === 'momo' || paymentMethod === 'mobile_money') {
      // Force mobile money only to avoid Paystack defaulting to card
      channels = ['mobile_money'];
      
      if (momoPhone) {
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = momoPhone.replace(/[\s-+()]/g, '');
        
        // Ensure Ghana country code
        let formattedPhone = cleanPhone;
        if (cleanPhone.startsWith('0')) {
          formattedPhone = '233' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('233')) {
          formattedPhone = '233' + cleanPhone;
        }

        mobileMoneyData = {
          phone: formattedPhone,
          provider: momoProvider || 'mtn' // Default to MTN if not specified
        };
      }
    }

    // Initialize payment with Paystack
    const paymentData = {
      email: order.customer.email,
      amount: order.totalAmount,
      reference: reference,
      currency: 'GHS',
      callback_url: `${process.env.APP_URL}/payment/callback`,
      channels: channels,
      mobile_money: mobileMoneyData,
      metadata: {
        orderId: orderId,
        customerId: order.customer._id.toString(),
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        orderNumber: order.orderNumber,
        paymentMethod: paymentMethod,
        items: order.items.map(item => ({
          serviceName: item.serviceName,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        }))
      }
    };

    const paystackResponse = await paystackService.initializePayment(paymentData);

    if (!paystackResponse.success) {
      return res.status(400).json({
        success: false,
        error: paystackResponse.error,
        details: paystackResponse.details
      });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ order: orderId });
    
    if (payment) {
      // Update existing payment
      payment.reference = reference;
      payment.paymentMethod = paymentMethod;
      payment.status = 'pending';
      payment.paystackData = {
        access_code: paystackResponse.data.access_code,
        authorization_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference
      };
      payment.statusHistory.push({
        status: 'pending',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Payment re-initialized with Paystack'
      });
    } else {
      // Create new payment record
      payment = new Payment({
        order: orderId,
        customer: order.customer._id,
        serviceProvider: order.serviceProvider,
        amount: order.totalAmount,
        paymentMethod: paymentMethod,
        reference: reference,
        status: 'pending',
        paystackData: {
          access_code: paystackResponse.data.access_code,
          authorization_url: paystackResponse.data.authorization_url,
          reference: paystackResponse.data.reference
        },
        paymentDetails: {
          phoneNumber: momoPhone,
          provider: momoProvider
        },
        statusHistory: [{
          status: 'pending',
          changedBy: req.user.id,
          changedAt: new Date(),
          notes: 'Payment initialized with Paystack'
        }]
      });
    }

    await payment.save();

    // Update order with payment reference
    if (!order.payment) {
      order.payment = payment._id;
      await order.save();
    }

    res.status(201).json({
      success: true,
      data: {
        payment: {
          _id: payment._id,
          reference: reference,
          amount: order.totalAmount,
          currency: 'GHS',
          status: 'pending'
        },
        paystack: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
          reference: paystackResponse.data.reference
        }
      },
      message: 'Payment initialized successfully'
    });

  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize payment'
    });
  }
});

// Verify payment
router.post('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;

    // Find payment by reference
    const payment = await Payment.findOne({ reference }).populate({
      path: 'order',
      populate: {
        path: 'customer',
        select: 'firstName lastName email phoneNumber'
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Verify with Paystack
    const verification = await paystackService.verifyPayment(reference);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: verification.error,
        details: verification.details
      });
    }

    // Update payment status based on verification
    const wasSuccessful = payment.status === 'completed';
    
    if (verification.success && verification.status === 'success') {
      payment.status = 'completed';
      payment.paidAt = new Date(verification.paid_at);
      payment.paystackData = {
        ...payment.paystackData,
        transaction_id: verification.data.id,
        gateway_response: verification.gateway_response,
        channel: verification.channel,
        authorization: verification.authorization,
        verified_at: new Date()
      };
      
      payment.statusHistory.push({
        status: 'completed',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: `Payment verified successfully via ${verification.channel}`
      });

      // Update order status if payment just became successful
      if (!wasSuccessful && payment.order) {
        const order = await Order.findById(payment.order._id);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          order.statusHistory = order.statusHistory || [];
          order.statusHistory.push({
            status: 'confirmed',
            changedBy: req.user.id,
            changedAt: new Date(),
            notes: 'Order confirmed - payment completed'
          });
          await order.save();
        }
      }
    } else {
      payment.status = 'failed';
      payment.paystackData = {
        ...payment.paystackData,
        gateway_response: verification.gateway_response,
        failed_at: new Date()
      };
      
      payment.statusHistory.push({
        status: 'failed',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: `Payment verification failed: ${verification.gateway_response}`
      });
    }

    await payment.save();

    res.json({
      success: verification.success,
      data: {
        payment: {
          _id: payment._id,
          reference: payment.reference,
          amount: payment.amount,
          status: payment.status,
          paidAt: payment.paidAt,
          channel: verification.channel,
          gateway_response: verification.gateway_response
        },
        verification: verification
      },
      message: verification.success ? 'Payment verified successfully' : 'Payment verification failed'
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
});

// Paystack webhook handler
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!paystackService.verifyWebhookSignature(signature, payload)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const event = JSON.parse(payload);
    console.log('Paystack webhook received:', event.event);

    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
      
      case 'charge.failed':
        await handleFailedPayment(event.data);
        break;
        
      case 'transfer.success':
        console.log('Transfer successful:', event.data.reference);
        break;
        
      case 'transfer.failed':
        console.log('Transfer failed:', event.data.reference);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// Handle successful payment from webhook
async function handleSuccessfulPayment(data) {
  try {
    const payment = await Payment.findOne({ reference: data.reference });
    
    if (!payment) {
      console.error('Payment not found for reference:', data.reference);
      return;
    }

    if (payment.status !== 'completed') {
      payment.status = 'completed';
      payment.paidAt = new Date(data.paid_at);
      payment.paystackData = {
        ...payment.paystackData,
        transaction_id: data.id,
        gateway_response: data.gateway_response,
        channel: data.channel,
        authorization: data.authorization,
        webhook_verified_at: new Date()
      };
      
      payment.statusHistory.push({
        status: 'completed',
        changedBy: 'system',
        changedAt: new Date(),
        notes: `Payment confirmed via webhook - ${data.channel}`
      });

      await payment.save();

      // Update associated order
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          order.statusHistory = order.statusHistory || [];
          order.statusHistory.push({
            status: 'confirmed',
            changedBy: 'system',
            changedAt: new Date(),
            notes: 'Order confirmed - payment completed via webhook'
          });
          await order.save();
        }
      }

      console.log('✅ Payment completed via webhook:', data.reference);
    }
  } catch (error) {
    console.error('Handle successful payment error:', error);
  }
}

// Handle failed payment from webhook
async function handleFailedPayment(data) {
  try {
    const payment = await Payment.findOne({ reference: data.reference });
    
    if (!payment) {
      console.error('Payment not found for reference:', data.reference);
      return;
    }

    if (payment.status !== 'failed' && payment.status !== 'completed') {
      payment.status = 'failed';
      payment.paystackData = {
        ...payment.paystackData,
        gateway_response: data.gateway_response,
        webhook_failed_at: new Date()
      };
      
      payment.statusHistory.push({
        status: 'failed',
        changedBy: 'system',
        changedAt: new Date(),
        notes: `Payment failed via webhook: ${data.gateway_response}`
      });

      await payment.save();
      console.log('❌ Payment failed via webhook:', data.reference);
    }
  } catch (error) {
    console.error('Handle failed payment error:', error);
  }
}

// Get payment status (auto-verify with Paystack when pending)
router.get('/status/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;

    let payment = await Payment.findOne({ reference })
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount items status',
        populate: {
          path: 'customer',
          select: 'firstName lastName email'
        }
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check if user can access this payment
    if (req.user.role === 'customer' && payment.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // If payment still pending/processing, verify with Paystack to auto-update
    if (payment.status === 'pending' || payment.status === 'processing') {
      try {
        const verification = await paystackService.verifyPayment(reference);
        if (verification.success && verification.data?.status === 'success') {
          // Update payment to completed
          payment.status = 'completed';
          payment.paidAt = new Date(verification.data.paid_at || Date.now());
          payment.paystackData = {
            ...payment.paystackData,
            transaction_id: verification.data.id,
            gateway_response: verification.data.gateway_response,
            channel: verification.data.channel,
            authorization: verification.data.authorization,
            verified_at: new Date()
          };
          payment.statusHistory.push({
            status: 'completed',
            changedBy: req.user.id,
            changedAt: new Date(),
            notes: 'Auto-verified via status check'
          });
          await payment.save();

          // Optionally update order status if needed
          if (payment.order && payment.order.status === 'pending') {
            const order = await Order.findById(payment.order._id);
            if (order) {
              order.status = 'confirmed';
              order.statusHistory = order.statusHistory || [];
              order.statusHistory.push({
                status: 'confirmed',
                changedBy: req.user.id,
                changedAt: new Date(),
                notes: 'Order confirmed - payment auto-verified'
              });
              await order.save();
              // re-populate to include updated order state
              payment = await Payment.findOne({ reference }).populate({
                path: 'order',
                select: 'orderNumber totalAmount items status',
                populate: { path: 'customer', select: 'firstName lastName email' }
              });
            }
          }
        } else if (verification.success && verification.data?.status === 'failed') {
          payment.status = 'failed';
          payment.failedAt = new Date();
          payment.paystackData = {
            ...payment.paystackData,
            gateway_response: verification.data.gateway_response,
            verified_at: new Date()
          };
          payment.statusHistory.push({
            status: 'failed',
            changedBy: req.user.id,
            changedAt: new Date(),
            notes: 'Auto-verified as failed via status check'
          });
          await payment.save();
        }
      } catch (e) {
        // Ignore verification errors here; keep returning current status
        console.warn('Paystack auto-verify during status check failed:', e?.message || e);
      }
    }

    res.json({
      success: true,
      data: {
        payment: {
          _id: payment._id,
          reference: payment.reference,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          channel: payment.paystackData?.channel,
          gateway_response: payment.paystackData?.gateway_response
        },
        order: payment.order
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
});

module.exports = router;