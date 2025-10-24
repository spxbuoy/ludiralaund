// Loyalty Program Service
const User = require('../models/User');
const Order = require('../models/Order');

// Loyalty program configuration
const LOYALTY_CONFIG = {
  pointsPerDollar: 1, // 1 point per dollar spent
  pointsForReferral: 50, // Points for referring a friend
  pointsForReview: 10, // Points for leaving a review
  minimumPointsForRedemption: 100, // Minimum points to redeem
  redemptionValue: 0.01, // $0.01 per point value
  pointsExpiryDays: 365, // Points expire after 1 year
};

// Award points for completed order
const awardPointsForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'completed') {
      return { success: false, message: 'Order is not completed' };
    }

    const customer = await User.findById(order.customer);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate points based on order total
    const pointsToAward = Math.floor(order.totalAmount * LOYALTY_CONFIG.pointsPerDollar);

    if (pointsToAward > 0) {
      await customer.addLoyaltyPoints(
        pointsToAward,
        `Earned ${pointsToAward} points for completing order ${order.orderNumber}`,
        orderId
      );

      return {
        success: true,
        pointsAwarded: pointsToAward,
        totalPoints: customer.loyaltyPoints,
        message: `Awarded ${pointsToAward} loyalty points for order completion`
      };
    }

    return { success: true, pointsAwarded: 0, message: 'No points awarded' };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    throw error;
  }
};

// Award points for referral
const awardPointsForReferral = async (userId, referralDescription = 'Referred a friend') => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.addLoyaltyPoints(
      LOYALTY_CONFIG.pointsForReferral,
      referralDescription
    );

    return {
      success: true,
      pointsAwarded: LOYALTY_CONFIG.pointsForReferral,
      totalPoints: user.loyaltyPoints
    };
  } catch (error) {
    console.error('Error awarding referral points:', error);
    throw error;
  }
};

// Award points for review
const awardPointsForReview = async (userId, orderId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.addLoyaltyPoints(
      LOYALTY_CONFIG.pointsForReview,
      `Earned ${LOYALTY_CONFIG.pointsForReview} points for leaving a review`,
      orderId
    );

    return {
      success: true,
      pointsAwarded: LOYALTY_CONFIG.pointsForReview,
      totalPoints: user.loyaltyPoints
    };
  } catch (error) {
    console.error('Error awarding review points:', error);
    throw error;
  }
};

// Redeem points for discount
const redeemPoints = async (userId, pointsToRedeem) => {
  try {
    if (pointsToRedeem < LOYALTY_CONFIG.minimumPointsForRedemption) {
      throw new Error(`Minimum ${LOYALTY_CONFIG.minimumPointsForRedemption} points required for redemption`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.loyaltyPoints < pointsToRedeem) {
      throw new Error('Insufficient loyalty points');
    }

    // Calculate discount value
    const discountValue = pointsToRedeem * LOYALTY_CONFIG.redemptionValue;

    await user.redeemLoyaltyPoints(
      pointsToRedeem,
      `Redeemed ${pointsToRedeem} points for $${discountValue.toFixed(2)} discount`
    );

    return {
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountValue: discountValue,
      remainingPoints: user.loyaltyPoints
    };
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
};

// Get user's loyalty status
const getLoyaltyStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const nextTierThreshold = getNextTierThreshold(user.loyaltyPoints);
    const pointsToNextTier = nextTierThreshold - user.loyaltyPoints;

    return {
      currentPoints: user.loyaltyPoints,
      currentTier: getLoyaltyTier(user.loyaltyPoints),
      nextTier: getLoyaltyTier(nextTierThreshold),
      pointsToNextTier: Math.max(0, pointsToNextTier),
      history: user.getLoyaltyHistory(20),
      config: LOYALTY_CONFIG
    };
  } catch (error) {
    console.error('Error getting loyalty status:', error);
    throw error;
  }
};

// Get loyalty tier based on points
const getLoyaltyTier = (points) => {
  if (points >= 1000) return 'Platinum';
  if (points >= 500) return 'Gold';
  if (points >= 200) return 'Silver';
  if (points >= 50) return 'Bronze';
  return 'New Member';
};

// Get next tier threshold
const getNextTierThreshold = (currentPoints) => {
  if (currentPoints < 50) return 50;
  if (currentPoints < 200) return 200;
  if (currentPoints < 500) return 500;
  if (currentPoints < 1000) return 1000;
  return currentPoints; // Already at max tier
};

// Clean up expired points (to be called by a cron job)
const cleanupExpiredPoints = async () => {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - LOYALTY_CONFIG.pointsExpiryDays);

    const users = await User.find({
      'loyaltyHistory.timestamp': { $lt: expiryDate },
      'loyaltyHistory.type': 'earned'
    });

    let totalExpiredPoints = 0;

    for (const user of users) {
      const expiredEntries = user.loyaltyHistory.filter(
        entry => entry.type === 'earned' &&
        entry.timestamp < expiryDate &&
        !entry.expired // Only process if not already marked as expired
      );

      for (const entry of expiredEntries) {
        // Mark as expired and deduct points
        entry.type = 'expired';
        user.loyaltyPoints = Math.max(0, user.loyaltyPoints - entry.points);
        totalExpiredPoints += entry.points;
      }

      if (expiredEntries.length > 0) {
        await user.save();
      }
    }

    return { success: true, expiredPoints: totalExpiredPoints };
  } catch (error) {
    console.error('Error cleaning up expired points:', error);
    throw error;
  }
};

module.exports = {
  awardPointsForOrder,
  awardPointsForReferral,
  awardPointsForReview,
  redeemPoints,
  getLoyaltyStatus,
  getLoyaltyTier,
  cleanupExpiredPoints,
  LOYALTY_CONFIG
};