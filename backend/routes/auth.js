// routes/auth.js
const express = require('express');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// Helper to generate 6-digit verification code or tokens
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const generateResetToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// In-memory storage for pending codes (temporary; in prod use Redis or DB)
const pendingRegistrations = new Map();

// ------------------------------------------------------------------
// Check email + "send" verification (we won't send — we store code only)
// ------------------------------------------------------------------
const checkEmailAndSendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate and store code, but DO NOT attempt to send email
    const verificationCode = generateVerificationCode();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations.set(normalized, {
      email: normalized,
      verificationCode,
      verificationExpire,
      createdAt: Date.now()
    });

    // Respond success. For testing you can optionally return the code.
    return res.json({
      message: 'Verification code generated (email sending skipped)',
      // ===== NOTE: remove the following line in production! =====
      verificationCode // returned so frontend/dev can continue flow without email
    });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Register: bypass email verification entirely (auto-verify user)
// ------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user immediately and auto-verify
    const user = await User.create({
      firstName,
      lastName,
      email: normalized,
      password,
      phoneNumber,
      role: role || 'customer',
      emailVerified: true, // AUTO-VERIFIED
      status: 'active'
    });

    if (user) {
      return res.status(201).json({
        message: 'Registration successful!',
        email: user.email,
        userId: user._id,
        token: generateToken(user._id),
        role: user.role
      });
    } else {
      return res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Verify email (kept for compatibility). Marks user verified if needed.
// ------------------------------------------------------------------
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // If already verified, just return success
    if (user.emailVerified) {
      return res.json({
        message: 'Email already verified',
        token: generateToken(user._id)
      });
    }

    // fallback: check pendingRegistrations if a code was generated earlier
    const pending = pendingRegistrations.get(email);
    if (!pending || pending.verificationCode !== code || Date.now() > pending.verificationExpire) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark verified
    user.emailVerified = true;
    await user.save();
    pendingRegistrations.delete(email);

    return res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Resend verification (we regenerate code and return it; no email)
// ------------------------------------------------------------------
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalized = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalized });
    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpire = Date.now() + 10 * 60 * 1000;

    pendingRegistrations.set(normalized, {
      email: normalized,
      verificationCode,
      verificationExpire,
      createdAt: Date.now()
    });

    return res.json({
      message: 'Verification code regenerated (email sending skipped)',
      // ===== NOTE: remove the following line in production! =====
      verificationCode
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Verify code endpoint for frontend to check codes (no email side-effects)
// ------------------------------------------------------------------
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    const pendingData = pendingRegistrations.get(email);
    if (!pendingData) {
      return res.status(400).json({ error: 'No pending registration found. Please request verification code again.' });
    }

    if (pendingData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (Date.now() > pendingData.verificationExpire) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    return res.json({
      message: 'Code verified successfully',
      email
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ error: 'Server error' });
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

// ------------------------------------------------------------------
// Check email availability
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Login (no emailVerified blocking)
// ------------------------------------------------------------------
const login = async (req, res) => {
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
        addresses: user.addresses,
        preferences: user.preferences,
        businessDetails: user.businessDetails,
        earnings: user.earnings,
        permissions: user.permissions,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Get current user
// ------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Update profile
// ------------------------------------------------------------------
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

    return res.json({
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
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Change password
// ------------------------------------------------------------------
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Forgot password (generate token, store it, and RETURN it — no email)
// ------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Return token in response for testing / bypassing email delivery
    return res.json({
      message: 'Password reset token generated (email sending skipped)',
      // ===== NOTE: remove the following line in production! =====
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ------------------------------------------------------------------
// Reset password (using token)
 // ------------------------------------------------------------------
const resetPassword = async (req, res) => {
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
router.post('/check-email', checkEmailAndSendVerification);
router.post('/verify-code', verifyCode);
router.post('/email-available', checkEmailAvailability);

module.exports = router;
