const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const reviewSchema = new mongoose.Schema({
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
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  // Detailed rating breakdown
  serviceQuality: {
    type: Number,
    min: [1, 'Service quality rating must be at least 1'],
    max: [5, 'Service quality rating cannot exceed 5'],
    default: 5
  },
  timeliness: {
    type: Number,
    min: [1, 'Timeliness rating must be at least 1'],
    max: [5, 'Timeliness rating cannot exceed 5'],
    default: 5
  },
  communication: {
    type: Number,
    min: [1, 'Communication rating must be at least 1'],
    max: [5, 'Communication rating cannot exceed 5'],
    default: 5
  },
  valueForMoney: {
    type: Number,
    min: [1, 'Value for money rating must be at least 1'],
    max: [5, 'Value for money rating cannot exceed 5'],
    default: 5
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  moderationHistory: [{
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected']
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    moderatedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [200, 'Moderation notes cannot exceed 200 characters']
    }
  }],
  helpfulVotes: {
    type: Number,
    default: 0
  },
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Flags for inappropriate content
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    enum: ['inappropriate', 'spam', 'fake', 'other']
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  flaggedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ order: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ serviceProvider: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for overall rating
reviewSchema.virtual('overallRating').get(function() {
  const ratings = [
    this.serviceQuality,
    this.timeliness,
    this.communication,
    this.valueForMoney
  ];
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for review status
reviewSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

reviewSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

reviewSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// Pre-save middleware to update moderation history
reviewSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.moderationHistory.push({
      status: this.status,
      moderatedBy: this.constructor.modelName === 'User' ? this._id : this.customer, // Simplified for demo
      moderatedAt: new Date()
    });
  }
  next();
});

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function(query = {}) {
  const stats = await this.aggregate([
    { $match: { ...query, status: 'approved' } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        avgServiceQuality: { $avg: '$serviceQuality' },
        avgTimeliness: { $avg: '$timeliness' },
        avgCommunication: { $avg: '$communication' },
        avgValueForMoney: { $avg: '$valueForMoney' }
      }
    }
  ]);

  return stats[0] || {
    avgRating: 0,
    totalReviews: 0,
    avgServiceQuality: 0,
    avgTimeliness: 0,
    avgCommunication: 0,
    avgValueForMoney: 0
  };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function(query = {}) {
  const distribution = await this.aggregate([
    { $match: { ...query, status: 'approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return distribution;
};

// Instance method to flag review
reviewSchema.methods.flagReview = async function(reason, flaggedBy) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedBy = flaggedBy;
  this.flaggedAt = new Date();
  await this.save();
};

// Instance method to unflag review
reviewSchema.methods.unflagReview = async function() {
  this.isFlagged = false;
  this.flagReason = undefined;
  this.flaggedBy = undefined;
  this.flaggedAt = undefined;
  await this.save();
};

// Instance method to vote helpful/unhelpful
reviewSchema.methods.vote = async function(isHelpful) {
  if (isHelpful) {
    this.helpfulVotes += 1;
  } else {
    this.unhelpfulVotes += 1;
  }
  await this.save();
};

// Add pagination plugin
reviewSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Review', reviewSchema); 