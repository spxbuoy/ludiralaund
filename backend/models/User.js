const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'service_provider', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  // General preferences for all users
  preferences: {
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      chatEmail: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyHistory: [{
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Service Provider specific fields
  location: String,
  businessDetails: {
    businessName: String,
    serviceAreas: [String],
    availableServices: [String],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    description: String,
    licenseNumber: String
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    }
  },
  // Admin specific fields
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageOrders: {
      type: Boolean,
      default: false
    },
    canManageServices: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canManagePayments: {
      type: Boolean,
      default: false
    },
    canModerateReviews: {
      type: Boolean,
      default: false
    },
    canManageNotifications: {
      type: Boolean,
      default: false
    },
    canViewAuditLogs: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') {
    return this.permissions[permission] || false;
  }
  return false;
};

// Loyalty points methods
userSchema.methods.addLoyaltyPoints = function(points, description, orderId = null) {
  this.loyaltyPoints += points;
  this.loyaltyHistory.push({
    type: 'earned',
    points: points,
    description: description,
    orderId: orderId
  });
  return this.save();
};

userSchema.methods.redeemLoyaltyPoints = function(points, description) {
  if (this.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }
  this.loyaltyPoints -= points;
  this.loyaltyHistory.push({
    type: 'redeemed',
    points: points,
    description: description
  });
  return this.save();
};

userSchema.methods.getLoyaltyPoints = function() {
  return this.loyaltyPoints;
};

userSchema.methods.getLoyaltyHistory = function(limit = 10) {
  return this.loyaltyHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpire;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 