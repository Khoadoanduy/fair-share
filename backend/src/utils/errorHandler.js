// utils/errorHandler.js

/**
 * Custom error class for structured API errors.
 */
export class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Middleware to handle unknown routes (404).
   */
  export function notFound(req, res, next) {
    res.status(404).json({
      success: false,
      error: {
        message: `🔍 Route not found: ${req.originalUrl}`,
        statusCode: 404,
      },
    });
  }
  
  /**
   * Central error handler middleware for Express.
   */
  export function errorHandler(err, req, res, next) {
    console.error('🚨 Error:', err);
  
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
  
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
      },
    });
  }
  