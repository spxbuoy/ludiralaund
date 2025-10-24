const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { protect, admin, serviceProvider } = require('../middleware/auth');

// GET /api/chats/:chatRoomId/messages - fetch chat history
router.get('/:chatRoomId/messages', protect, async (req, res) => {
  try {
    // Only allow access if user is in the chat room, supplier, or admin
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId);
    if (!chatRoom) return res.status(404).json({ error: 'Chat room not found' });
    if (
      req.user.role === 'admin' ||
      req.user.role === 'service_provider' ||
      (req.user.role === 'customer' && chatRoom.customerId.toString() === req.user._id.toString())
    ) {
      const messages = await Message.find({ chatRoomId: req.params.chatRoomId }).sort({ timestamp: 1 });
      return res.json(messages);
    }
    return res.status(403).json({ error: 'Not authorized to view this chat room' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chats/:chatRoomId/message - send a message (fallback)
router.post('/:chatRoomId/message', protect, async (req, res) => {
  const { senderType, senderId, content } = req.body;
  try {
    // Only allow sending if user is in the chat room, supplier, or admin
    const chatRoom = await ChatRoom.findById(req.params.chatRoomId);
    if (!chatRoom) return res.status(404).json({ error: 'Chat room not found' });
    if (
      req.user.role === 'admin' ||
      req.user.role === 'service_provider' ||
      (req.user.role === 'customer' && chatRoom.customerId.toString() === req.user._id.toString())
    ) {
      const message = new Message({
        chatRoomId: req.params.chatRoomId,
        senderType,
        senderId,
        content
      });
      await message.save();
      return res.status(201).json(message);
    }
    return res.status(403).json({ error: 'Not authorized to send message to this chat room' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/chats/room - find or create a chat room for a customer/order
router.post('/room', protect, async (req, res) => {
  const { customerId, orderId } = req.body;
  try {
    // Only allow customers to create their own room, or admin/supplier
    if (
      req.user.role === 'admin' ||
      req.user.role === 'service_provider' ||
      (req.user.role === 'customer' && customerId === req.user._id.toString())
    ) {
      let chatRoom = await ChatRoom.findOne({ customerId, orderId });
      if (!chatRoom) {
        chatRoom = new ChatRoom({ customerId, orderId });
        await chatRoom.save();
      }
      return res.status(200).json(chatRoom);
    }
    return res.status(403).json({ error: 'Not authorized to create/find this chat room' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find or create chat room' });
  }
});

// GET /api/chats/user/:userId - list all chat rooms for a user (customer or supplier)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    // Only allow the user themselves, suppliers, or admin
    if (
      req.user.role === 'admin' ||
      req.user.role === 'service_provider' ||
      req.user._id.toString() === req.params.userId
    ) {
      const chatRooms = await ChatRoom.find({ customerId: req.params.userId });
      return res.json(chatRooms);
    }
    return res.status(403).json({ error: 'Not authorized to view these chat rooms' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// GET /api/chats - list all chat rooms (admin/supplier only)
router.get('/', protect, async (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'service_provider') {
    try {
      let query = {};

      // For service providers, only show chat rooms assigned to them
      if (req.user.role === 'service_provider') {
        query.supplierId = req.user._id;
      }

      const chatRooms = await ChatRoom.find(query);
      return res.json(chatRooms);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch all chat rooms' });
    }
  }
  return res.status(403).json({ error: 'Not authorized to view all chat rooms' });
});

// PATCH /api/chats/:chatRoomId/assign - assign a supplier to a chat room (admin only)
router.patch('/:chatRoomId/assign', protect, admin, async (req, res) => {
  const { supplierId } = req.body;
  try {
    const chatRoom = await ChatRoom.findByIdAndUpdate(
      req.params.chatRoomId,
      { supplierId },
      { new: true }
    );
    if (!chatRoom) return res.status(404).json({ error: 'Chat room not found' });
    res.json(chatRoom);
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign supplier' });
  }
});

// PATCH /api/chats/:chatRoomId/messages/read - mark messages as read for a user
router.patch('/:chatRoomId/messages/read', protect, async (req, res) => {
  const { userId } = req.body;
  try {
    await Message.updateMany(
      { chatRoomId: req.params.chatRoomId, 'readBy': { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router; 