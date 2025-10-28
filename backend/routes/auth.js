// routes/auth.js
const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// ----------------------------
// Helper functions
// ----------------------------
const generateResetToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// ----------------------------
// Routes
// ----------------------------

// @desc    Register user (skip email verification)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: normalized,
      password,
      phoneNumber,
      role: role || 'customer',
      emailVerified: true, // automatically verified
      status: 'active'
    });

    return res.status(201).json({
      message: 'Registration successful',
      email: user.email,
      userId: user._id,
      token: generateToken(user._id),
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      user.lastLogin = new Date();
      await user.save();

      return res.json({
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
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Server error' });
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

    return res.json({
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
    return res.status(500).json({ error: 'Server error' });
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

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Forgot password (generate token and return it)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Skip sending email; return token for testing / bypass
    return res.json({ message: 'Password reset token generated', resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Check email availability (frontend expects /check-email)
const checkEmailHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    return res.json({ available: !userExists });
  } catch (error) {
    console.error('Check email availability error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

router.post('/check-email', checkEmailHandler);
// alias some frontends call /email-available
router.post('/email-available', checkEmailHandler);

// @desc    Verify code (frontend might still call this) — accepts any code and verifies user
router.post('/verify-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(400).json({ error: 'User not found' });

    user.emailVerified = true;
    await user.save();

    return res.json({
      message: 'Verification skipped (auto-verified)',
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------
// Export router
// ----------------------------
module.exports = router;
