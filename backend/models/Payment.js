const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'digital_wallet', 'momo', 'mobile_money']
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Paystack-specific fields
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  paystackData: {
    access_code: String,
    authorization_url: String,
    reference: String,
    transaction_id: String,
    gateway_response: String,
    channel: String, // mobile_money, card, bank, etc.
    authorization: mongoose.Schema.Types.Mixed,
    verified_at: Date,
    webhook_verified_at: Date,
    failed_at: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Add paidAt field
  paidAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  statusHistory: [{
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [200, 'Status notes cannot exceed 200 characters']
    }
  }],
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
    default: 0
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String,
    maxlength: [200, 'Refund reason cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ serviceProvider: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

// Virtual for payment status
paymentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

paymentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

paymentSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

// Pre-save middleware to update timestamps
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.constructor.modelName === 'User' ? this._id : this.customer, // Simplified for demo
      changedAt: new Date()
    });
  }
  next();
});

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(query = {}) {
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return stats;
};

// Instance method to process payment
paymentSchema.methods.processPayment = async function() {
  this.status = 'processing';
  this.processedAt = new Date();
  await this.save();
  
  // Simulate payment processing
  setTimeout(async () => {
    this.status = 'completed';
    this.completedAt = new Date();
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.save();
  }, 2000);
};

// Instance method to refund payment
paymentSchema.methods.refundPayment = async function(amount, reason) {
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refundAmount = amount;
  this.refundedAt = new Date();
  this.refundReason = reason;
  await this.save();
};

// Add pagination plugin
paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', paymentSchema);
