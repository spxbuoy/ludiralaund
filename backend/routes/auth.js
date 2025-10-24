const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// In-memory storage for pending registrations (in production, use Redis)
const pendingRegistrations = new Map();

// @desc    Check email availability and send verification code
// @route   POST /api/auth/check-email
// @access  Public
const checkEmailAndSendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store pending registration data temporarily
    const pendingData = {
      email,
      verificationCode,
      verificationExpire,
      createdAt: Date.now()
    };

    // Store in memory (in production, use Redis with expiration)
    pendingRegistrations.set(email, pendingData);

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.json({
      message: 'Verification code sent to your email',
      email: email
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Register user with email verification
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role, verificationCode } = req.body;

    // Check if user exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get pending registration data
    const pendingData = pendingRegistrations.get(email);
    if (!pendingData) {
      return res.status(400).json({ error: 'No pending registration found. Please request verification code again.' });
    }

    // Verify the code
    if (pendingData.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code is expired
    if (Date.now() > pendingData.verificationExpire) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Create user in database
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role || 'customer',
      emailVerified: true, // Since we verified before saving
      status: 'active'
    });

    // Remove from pending registrations
    pendingRegistrations.delete(email);

    if (user) {
      res.status(201).json({
        message: 'Registration successful!',
        email: user.email,
        userId: user._id,
        token: generateToken(user._id),
        role: user.role
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ 
      email,
      emailVerificationToken: code,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Generate token and return user data
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update or create pending registration data
    const pendingData = {
      email,
      verificationCode,
      verificationExpire,
      createdAt: Date.now()
    };

    pendingRegistrations.set(email, pendingData);

    // Send new verification email
    await sendVerificationEmail(email, verificationCode);

    res.json({
      message: 'Verification code resent successfully. Please check your email.',
      email: email
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Verify code during registration
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Get pending registration data
    const pendingData = pendingRegistrations.get(email);
    if (!pendingData) {
      return res.status(400).json({ error: 'No pending registration found. Please request verification code again.' });
    }

    // Verify the code
    if (pendingData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code is expired
    if (Date.now() > pendingData.verificationExpire) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    res.json({
      message: 'Code verified successfully',
      email: email
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Clean up expired pending registrations (run every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations.entries()) {
    if (now > data.verificationExpire) {
      pendingRegistrations.delete(email);
    }
  }
}, 10 * 60 * 1000);

// @desc    Check if email is available (no side effects)
// @route   POST /api/auth/email-available
// @access  Public
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    return res.json({ available: !userExists });
  } catch (error) {
    console.error('Check email availability error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      // Update last login
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
        addresses: user.addresses,
        preferences: user.preferences,
        businessDetails: user.businessDetails,
        earnings: user.earnings,
        permissions: user.permissions,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, addresses, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.addresses = addresses || user.addresses;
      user.preferences = preferences || user.preferences;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        status: updatedUser.status,
        addresses: updatedUser.addresses,
        preferences: updatedUser.preferences,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token (simplified for now)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);
    
    res.json({ 
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



// Routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/check-email', checkEmailAndSendVerification); // Added new route
router.post('/verify-code', verifyCode); // Added new route
router.post('/email-available', checkEmailAvailability); // New route for availability check


module.exports = router; 