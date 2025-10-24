const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  // Allow both legacy 'supplier' and current 'service_provider' for compatibility
  senderType: { type: String, enum: ['customer', 'service_provider', 'supplier', 'admin'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  auditLog: [{
    action: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Message', MessageSchema); 