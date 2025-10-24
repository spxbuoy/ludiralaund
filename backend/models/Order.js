const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const clothingItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: false, // Unique within the order context
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Item description cannot exceed 100 characters'],
  },
  service: {
    type: String, // Service ID
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  isConfirmed: {
    type: Boolean,
    default: false, // Provider confirms receiving this item
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot exceed 200 characters'],
  },
});

const orderItemSchema = new mongoose.Schema({
  service: {
    type: String, // Changed from Schema.Types.ObjectId to String
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative'],
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot exceed 200 characters'],
  },
  // Individual clothing items for this service
  clothingItems: [clothingItemSchema],
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'ready_for_pickup', 'picked_up', 'ready_for_delivery', 'completed', 'cancelled'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  pickupAddress: {
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    instructions: String,
  },
  deliveryAddress: {
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    instructions: String,
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  actualPickupDate: Date,
  actualDeliveryDate: Date,
  estimatedPickupTime: String,
  estimatedDeliveryTime: String,
  payment: {
    type: String,
    ref: 'Payment',
  },
  notes: {
    customer: String,
    serviceProvider: String,
    admin: String,
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  review: {
    type: String,
    trim: true,
    maxlength: [500, 'Review cannot exceed 500 characters'],
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters'],
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative'],
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
}, {
  timestamps: true,
});

// Index for better query performance
orderSchema.index({ customer: 1 });
orderSchema.index({ serviceProvider: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ pickupDate: 1 });
orderSchema.index({ deliveryDate: 1 });

// Virtual for order number
orderSchema.virtual('orderNumber').get(function () {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for formatted total amount (Ghana Cedis)
orderSchema.virtual('formattedTotal').get(function () {
  return `¢${this.totalAmount.toFixed(2)}`;
});

// Virtual for order duration in days
orderSchema.virtual('duration').get(function () {
  if (this.actualPickupDate && this.actualDeliveryDate) {
    const diffTime = this.actualDeliveryDate - this.actualPickupDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Method to calculate total
orderSchema.methods.calculateTotal = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.tax + this.deliveryFee - this.discount;
  return this.totalAmount;
};

// Method to update status
orderSchema.methods.updateStatus = function (newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.notes.admin = notes;
  }
  return this.save();
};

// Method to generate unique item ID
orderSchema.methods.generateItemId = function () {
  const orderNumber = this.orderNumber || `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
  const itemCount = this.items.reduce((total, item) => total + (item.clothingItems?.length || 0), 0);
  return `${orderNumber}-${String(itemCount + 1).padStart(3, '0')}`;
};

// Method to add clothing item
orderSchema.methods.addClothingItem = function (serviceId, description, specialInstructions = '') {
  const service = this.items.find(item => item.service === serviceId);
  if (!service) {
    throw new Error('Service not found in order');
  }
  
  const itemId = this.generateItemId();
  const clothingItem = {
    itemId,
    description,
    service: serviceId,
    serviceName: service.serviceName,
    unitPrice: service.unitPrice,
    specialInstructions,
    isConfirmed: false
  };
  
  service.clothingItems = service.clothingItems || [];
  service.clothingItems.push(clothingItem);
  return clothingItem;
};

// Method to confirm clothing item (provider use)
orderSchema.methods.confirmClothingItem = function (itemId, confirmed = true) {
  for (const item of this.items) {
    if (item.clothingItems) {
      const clothingItem = item.clothingItems.find(ci => ci.itemId === itemId);
      if (clothingItem) {
        clothingItem.isConfirmed = confirmed;
        return clothingItem;
      }
    }
  }
  throw new Error('Clothing item not found');
};

// Method to get all clothing items
orderSchema.methods.getAllClothingItems = function () {
  const allItems = [];
  for (const item of this.items) {
    if (item.clothingItems && item.clothingItems.length > 0) {
      allItems.push(...item.clothingItems);
    }
  }
  return allItems;
};

// Pre-save middleware to calculate total and ensure clothing item IDs
orderSchema.pre('save', function (next) {
  // Recalculate totals when relevant fields change
  if (
    this.isModified('items') ||
    this.isModified('tax') ||
    this.isModified('deliveryFee') ||
    this.isModified('discount')
  ) {
    this.calculateTotal();
  }

  // Ensure each clothing item has a unique itemId within the order
  try {
    if (Array.isArray(this.items)) {
      for (const orderItem of this.items) {
        if (Array.isArray(orderItem.clothingItems)) {
          for (const ci of orderItem.clothingItems) {
            // Assign ID if missing
            if (!ci.itemId || typeof ci.itemId !== 'string' || ci.itemId.trim() === '') {
              ci.itemId = this.generateItemId();
            }
            // Fallbacks to keep data consistent
            if (!ci.serviceName && orderItem.serviceName) ci.serviceName = orderItem.serviceName;
            if (typeof ci.unitPrice !== 'number' || isNaN(ci.unitPrice)) ci.unitPrice = orderItem.unitPrice || 0;
          }
        }
      }
    }
  } catch (e) {
    // Do not block save on ID backfill errors; continue
    // You can log here if needed
  }

  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', {
  virtuals: true,
});

// Add pagination plugin
orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);