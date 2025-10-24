
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Logger utility
const logger = {
  log: (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // Log to console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);

    // Log to file
    const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  },

  info: (message, meta) => logger.log('info', message, meta),
  warn: (message, meta) => logger.log('warn', message, meta),
  error: (message, meta) => logger.log('error', message, meta),
  debug: (message, meta) => logger.log('debug', message, meta)
};

// MongoDB Error Handler
const handleMongoDBError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    return new ValidationError(`Validation Error: ${errors.join('. ')}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ValidationError(`${field} already exists`);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }

  return new AppError('Database operation failed', 500, false);
};

// JWT Error Handler
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  return new AuthenticationError('Authentication failed');
};

// Global Error Handler Middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Handle specific error types
  if (err.name === 'ValidationError' || err.code === 11000 || err.name === 'CastError') {
    error = handleMongoDBError(err);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // Default to 500 server error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async Error Handler
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  globalErrorHandler,
  catchAsync,
  notFoundHandler,
  logger
};
