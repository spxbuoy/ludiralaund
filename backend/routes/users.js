const express = require('express');
const User = require('../models/User');
const { protect, admin, hasPermission } = require('../middleware/auth');
const Service = require('../models/Service');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword ? {
      $or: [
        { firstName: { $regex: req.query.keyword, $options: 'i' } },
        { lastName: { $regex: req.query.keyword, $options: 'i' } },
        { email: { $regex: req.query.keyword, $options: 'i' } }
      ]
    } : {};

    const count = await User.countDocuments({ ...keyword });
    const users = await User.find({ ...keyword })
      .select('-password')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      users,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Service Provider (for customers in their chat rooms)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      // Allow access if:
      // 1. User is admin, OR
      // 2. User is service provider and the requested user is a customer they're assigned to chat with
      if (req.user.role === 'admin') {
        return res.json(user);
      }

      if (req.user.role === 'service_provider' && user.role === 'customer') {
        // Check if service provider has a chat room with this customer
        const ChatRoom = require('../models/ChatRoom');
        const chatRoom = await ChatRoom.findOne({
          customerId: user._id,
          supplierId: req.user._id
        });

        if (chatRoom) {
          return res.json(user);
        } else {
          return res.status(403).json({ error: 'Not authorized to view this customer' });
        }
      }

      // Deny access for other cases
      return res.status(403).json({ error: 'Not authorized to view this user' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role, status } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role || 'customer',
      status: status || 'active'
    });

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, role, status, permissions } = req.body;

    const user = await User.findById(req.params.id);

    if (user) {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.role = role || user.role;
      user.status = status || user.status;
      
      if (permissions && user.role === 'admin') {
        user.permissions = { ...user.permissions, ...permissions };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        status: updatedUser.status,
        permissions: updatedUser.permissions
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);

    if (user) {
      // Check if user is referenced in Service or Order
      const isProvider = await Service.findOne({ provider: user._id });
      const isOrderCustomer = await Order.findOne({ customer: user._id });
      const isOrderProvider = await Order.findOne({ serviceProvider: user._id });
      if (isProvider || isOrderCustomer || isOrderProvider) {
        return res.status(400).json({ error: 'Cannot delete user: user is referenced in other records.' });
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Toggle user status (admin only)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.status = user.status === 'active' ? 'suspended' : 'active';
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        status: updatedUser.status
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private/Admin
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password').sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  try {
    const { notificationPreferences } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      if (notificationPreferences) {
        user.preferences = {
          ...user.preferences,
          notificationPreferences: {
            ...user.preferences.notificationPreferences,
            ...notificationPreferences
          }
        };
      }

      const updatedUser = await user.save();

      res.json({
        preferences: updatedUser.preferences
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const customers = await User.countDocuments({ role: 'customer' });
    const serviceProviders = await User.countDocuments({ role: 'service_provider' });
    const admins = await User.countDocuments({ role: 'admin' });

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      customers,
      serviceProviders,
      admins
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Routes - Specific routes must come before parameterized routes
router.put('/preferences', protect, updateUserPreferences);
router.put('/:id/toggle-status', protect, admin, toggleUserStatus);
router.get('/', protect, admin, getUsers);
router.get('/stats', protect, admin, getUserStats);
router.get('/role/:role', protect, admin, getUsersByRole);
// Generic parameterized routes
router.get('/:id', protect, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.post('/', protect, admin, createUser);

module.exports = router; 