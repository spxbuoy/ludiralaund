const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// DEV_MODE flag from .env
const DEV_MODE = process.env.DEV_MODE === 'true';

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// In-memory storage for pending registrations
const pendingRegistrations = new Map();

// -------------------- ROUTE HANDLERS --------------------

// Check email availability & send verification code
const checkEmailAndSendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'Email already registered' });

    const verificationCode = generateVerificationCode();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 min

    const pendingData = { email, verificationCode, verificationExpire, createdAt: Date.now() };
    pendingRegistrations.set(email, pendingData);

    if (!DEV_MODE) {
      await sendVerificationEmail(email, verificationCode);
    } else {
      console.log(`[DEV_MODE] Skipping email send for ${email}: code=${verificationCode}`);
    }

    res.json({ message: DEV_MODE ? 'DEV_MODE: skipped email' : 'Verification code sent', email });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Register user
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role, verificationCode } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const pendingData = pendingRegistrations.get(email);

    if (!DEV_MODE) {
      if (!pendingData) return res.status(400).json({ error: 'No pending registration found.' });
      if (pendingData.verificationCode !== verificationCode) return res.status(400).json({ error: 'Invalid verification code' });
      if (Date.now() > pendingData.verificationExpire) {
        pendingRegistrations.delete(email);
        return res.status(400).json({ error: 'Verification code expired' });
      }
    } else {
      console.log(`[DEV_MODE] Skipping verification check for ${email}`);
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role || 'customer',
      emailVerified: true,
      status: 'active'
    });

    pendingRegistrations.delete(email);

    res.status(201).json({
      message: 'Registration successful!',
      email: user.email,
      userId: user._id,
      token: generateToken(user._id),
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.comparePassword(password))) {
      user.lastLogin = new Date();
      await user.save();
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id),
        role: user.role
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, addresses, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.addresses = addresses || user.addresses;
    user.preferences = preferences || user.preferences;

    const updatedUser = await user.save();
    res.json({ ...updatedUser.toObject(), token: generateToken(updatedUser._id) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (!DEV_MODE) {
      await sendPasswordResetEmail(email, resetToken);
    } else {
      console.log(`[DEV_MODE] Skipping password email for ${email}: token=${resetToken}`);
    }

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
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
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// -------------------- CLEANUP --------------------
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations.entries()) {
    if (now > data.verificationExpire) pendingRegistrations.delete(email);
  }
}, 10 * 60 * 1000);

// -------------------- ROUTES --------------------
router.post('/register', register);
router.post('/check-email', checkEmailAndSendVerification);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// Optional email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/verify-code', verifyCode);
router.post('/email-available', checkEmailAvailability);

module.exports = router;
