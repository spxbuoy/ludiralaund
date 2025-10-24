
const mongoose = require('mongoose');

const orderTrackingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  currentLocation: {
    type: String,
    enum: ['pending', 'pickup_scheduled', 'picked_up', 'in_transit_to_facility', 'at_facility', 'cleaning', 'ready_for_delivery', 'out_for_delivery', 'delivered'],
    default: 'pending'
  },
  trackingSteps: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String,
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  estimatedDelivery: Date,
  actualDelivery: Date,
  driverInfo: {
    name: String,
    phone: String,
    vehicleNumber: String
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

orderTrackingSchema.methods.updateLocation = function(status, notes = '', updatedBy = null) {
  this.currentLocation = status;
  this.trackingSteps.push({
    status,
    notes,
    updatedBy,
    timestamp: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('OrderTracking', orderTrackingSchema);
