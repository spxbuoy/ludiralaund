
const mongoose = require('mongoose');

const loyaltyAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalRedeemed: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    description: String,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referrals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate referral code before saving
loyaltyAccountSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    this.referralCode = `REF${this.user.toString().slice(-6).toUpperCase()}${Date.now().toString().slice(-4)}`;
  }
  next();
});

// Calculate tier based on total earned points
loyaltyAccountSchema.methods.updateTier = function() {
  if (this.totalEarned >= 10000) {
    this.tier = 'platinum';
  } else if (this.totalEarned >= 5000) {
    this.tier = 'gold';
  } else if (this.totalEarned >= 2000) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
  return this.save();
};

// Add points
loyaltyAccountSchema.methods.addPoints = function(points, description, orderId = null) {
  this.points += points;
  this.totalEarned += points;
  this.transactions.push({
    type: 'earned',
    points,
    description,
    orderId
  });
  return this.updateTier();
};

// Redeem points
loyaltyAccountSchema.methods.redeemPoints = function(points, description) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  
  this.points -= points;
  this.totalRedeemed += points;
  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description
  });
  return this.save();
};

// Get tier benefits
loyaltyAccountSchema.virtual('tierBenefits').get(function() {
  const benefits = {
    bronze: { discount: 0, pointsMultiplier: 1, freeDelivery: false },
    silver: { discount: 5, pointsMultiplier: 1.2, freeDelivery: false },
    gold: { discount: 10, pointsMultiplier: 1.5, freeDelivery: true },
    platinum: { discount: 15, pointsMultiplier: 2, freeDelivery: true }
  };
  return benefits[this.tier];
});

loyaltyAccountSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('LoyaltyProgram', loyaltyAccountSchema);
