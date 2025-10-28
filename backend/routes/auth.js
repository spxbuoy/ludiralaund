const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// ----------------------------
// Helper functions
// ----------------------------

// Generate a simple reset token
const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// ----------------------------
// Routes
// ----------------------------

// @desc    Register user (skip email verification)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role || 'customer',
      emailVerified: true, // automatically verified
      status: 'active'
    });

    res.status(201).json({
      message: 'Registration successful',
      email: user.email,
      userId: user._id,
      token: generateToken(user._id),
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && await user.comparePassword(password)) {
      user.lastLogin = new Date();
      await user.save();

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      status: updatedUser.status,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Change password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!await user.comparePassword(currentPassword)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Skip sending email, just return token
    res.json({ message: 'Password reset token generated', resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Check email availability
router.post('/email-available', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    res.json({ available: !userExists });
  } catch (error) {
    console.error('Check email availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------
// Routes export
// ----------------------------
router.post('/register', router.stack.find(r => r.route && r.route.path === '/register').route.stack[0].handle);
router.post('/login', router.stack.find(r => r.route && r.route.path === '/login').route.stack[0].handle);
router.get('/me', protect, router.stack.find(r => r.route && r.route.path === '/me').route.stack[0].handle);
router.put('/profile', protect, router.stack.find(r => r.route && r.route.path === '/profile').route.stack[0].handle);
router.put('/password', protect, router.stack.find(r => r.route && r.route.path === '/password').route.stack[0].handle);
router.post('/forgot-password', router.stack.find(r => r.route && r.route.path === '/forgot-password').route.stack[0].handle);
router.post('/reset-password', router.stack.find(r => r.route && r.route.path === '/reset-password').route.stack[0].handle);
router.post('/check-email', router.stack.find(r => r.route && r.route.path === '/check-email').route.stack[0].handle);

module.exports = router;
