const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    trim: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  estimatedTime: {
    type: String,
    required: [true, 'Estimated time is required']
  },
  requirements: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  // This is the missing field that's causing the error
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Make sure this references the correct model name
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ basePrice: 1 });

module.exports = mongoose.model('Service', serviceSchema);