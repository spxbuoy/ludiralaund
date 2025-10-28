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

// @desc Check email availability and send verification code
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

// @desc Register user
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

// Clean up expired pending registrations every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations.entries()) {
    if (now > data.verificationExpire) pendingRegistrations.delete(email);
  }
}, 10 * 60 * 1000);

// All other routes remain unchanged (login, forgot-password, reset-password, etc.)

// Routes
router.post('/register', register);
router.post('/check-email', checkEmailAndSendVerification);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/verify-code', verifyCode);
router.post('/email-available', checkEmailAvailability);

module.exports = router;
