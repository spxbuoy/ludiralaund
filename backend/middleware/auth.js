const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hardcoded JWT secret (no env files)
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Not authorized as admin' });
  }
};

// Service provider middleware
const serviceProvider = (req, res, next) => {
  if (req.user && (req.user.role === 'service_provider' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Not authorized as service provider' });
  }
};

// Customer middleware
const customer = (req, res, next) => {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ error: 'Not authorized as customer' });
  }
};

// Permission middleware
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'admin' && req.user.hasPermission(permission)) {
      next();
    } else {
      return res.status(403).json({ error: `Not authorized, missing permission: ${permission}` });
    }
  };
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  protect,
  admin,
  serviceProvider,
  customer,
  hasPermission,
  generateToken
}; 