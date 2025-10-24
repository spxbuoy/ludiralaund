require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');
const Order = require('./models/Order');
const { sendChatMessageEmail } = require('./services/emailService');



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://laundry-app-cyan.vercel.app',
      'https://laundry-rd6qs9np9-seyram779kjs-projects.vercel.app'
    ],
    methods: ['GET', 'POST']
  }
});

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ohenebasayram:KinG123%40%26@cluster0.m3p1erd.mongodb.net/';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://laundry-app-cyan.vercel.app',
    'https://laundry-rd6qs9np9-seyram779kjs-projects.vercel.app'
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
// MongoDB Connection - Modified to use persistent database
const initializeDatabase = async () => {
  try {
    // Always use persistent MongoDB - no memory server
    const mongoUri = MONGODB_URI; // 'mongodb://localhost:27017/laundry-app'
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('Connected to MongoDB');
    console.log('MongoDB URI:', mongoUri);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Make sure MongoDB is running locally on port 27017');
    // Don't exit the process, allow the server to run without database
  }
};
// Initialize database
initializeDatabase();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const serviceRoutes = require('./routes/services');
const paymentRoutes = require('./routes/payments');
const paystackRoutes = require('./routes/paystack');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chats');
const loyaltyRoutes = require('./routes/loyalty');
const trackingRoutes = require('./routes/tracking');

// Import middleware
const { globalErrorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { cacheMiddleware } = require('./middleware/cache');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', cacheMiddleware(300), serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', cacheMiddleware(600), analyticsRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/tracking', trackingRoutes);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a chat room
  socket.on('joinRoom', ({ chatRoomId }) => {
    socket.join(chatRoomId);
    console.log(`Socket ${socket.id} joined room ${chatRoomId}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async (data) => {
    const { chatRoomId, senderType, senderId, content } = data;
    try {
      const message = new Message({
        chatRoomId,
        senderType,
        senderId,
        content
      });
      await message.save();

      // Send email notifications
      try {
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (chatRoom) {
          const sender = await User.findById(senderId);
          const senderName = sender ? sender.getFullName() : 'Unknown User';

          let recipients = [];
          let orderNumber = null;

          // Get order number if exists
          if (chatRoom.orderId) {
            const order = await Order.findById(chatRoom.orderId);
            if (order) {
              orderNumber = order.orderNumber;
            }
          }

          if (senderType === 'customer') {
            // Send to supplier or admin
            if (chatRoom.supplierId) {
              recipients.push(chatRoom.supplierId.toString());
            } else {
              // Find admin users
              const admins = await User.find({ role: 'admin' });
              recipients = admins.map(admin => admin._id.toString());
            }
          } else if (senderType === 'service_provider' || senderType === 'supplier') {
            // Send to customer
            recipients.push(chatRoom.customerId.toString());
          } else if (senderType === 'admin') {
            // Send to customer and supplier
            recipients.push(chatRoom.customerId.toString());
            if (chatRoom.supplierId) {
              recipients.push(chatRoom.supplierId.toString());
            }
          }

          // Send emails to recipients who have chat email notifications enabled
          for (const recipientId of recipients) {
            if (recipientId !== senderId) { // Don't send to self
              const recipient = await User.findById(recipientId);
              if (recipient && recipient.preferences?.notificationPreferences?.chatEmail !== false) {
                await sendChatMessageEmail(recipient.email, senderName, content, orderNumber);
              }
            }
          }
        }
      } catch (emailErr) {
        console.error('Error sending chat email notification:', emailErr);
        // Don't fail the message sending if email fails
      }

      io.to(chatRoomId).emit('newMessage', message);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Laundry App Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      orders: '/api/orders',
      services: '/api/services',
      payments: '/api/payments'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Laundry App Backend is running' });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
//hi
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    const { stopMongoDB } = require('./setupMongo');
    await stopMongoDB();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    const { stopMongoDB } = require('./setupMongo');
    await stopMongoDB();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});
module.exports = app; 