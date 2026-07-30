const logger = require('../utils/logger');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const env = require('../config/env');

/**
 * Global Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors || null;

  // Log error stack trace
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Handle SQL Server Driver Errors
  if (err.name === 'RequestError' || err.name === 'ConnectionError') {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    errorCode = 'DATABASE_ERROR';
    message = 'Database operation failed. Please try again later.';
  }

  const responsePayload = {
    success: false,
    status: statusCode,
    message,
    errorCode,
    errors,
    timestamp: new Date().toISOString()
  };

  // Attach stack trace only in non-production environments
  if (env.NODE_ENV !== 'production' && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}

module.exports = errorHandler;
