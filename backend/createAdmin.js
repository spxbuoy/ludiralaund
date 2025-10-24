const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/laundry-app';

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);

  const adminData = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'adminpassword', // Will be hashed by pre-save hook
    phoneNumber: '0000000000',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    permissions: {
      canManageUsers: true,
      canManageOrders: true,
      canManageServices: true,
      canViewAnalytics: true,
      canManagePayments: true,
      canModerateReviews: true,
      canManageNotifications: true,
      canViewAuditLogs: true
    }
  };

  // Check if admin already exists
  const existing = await User.findOne({ email: adminData.email });
  if (existing) {
    console.log('Admin user already exists:', existing.email);
    process.exit(0);
  }

  const admin = new User(adminData);
  await admin.save();
  console.log('Admin user created:', admin.email);
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
}); 