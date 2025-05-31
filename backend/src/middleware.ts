import { Request, Response, NextFunction } from 'express';
import { ClerkExpressWithAuth, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Authentication middleware for public/private route handling
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const publicPaths = [
    /^\/webhooks(\/.*)?$/, // Webhook routes
    /^\/api\/health$/, // Health check endpoint
    /\.(html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/ // Static files
  ];
  
  // Check if path should be public
  const isPublicPath = publicPaths.some(pattern => pattern.test(req.path));
  
  if (isPublicPath) {
    // Skip authentication for public routes
    return next();
  } else {
    // Apply Clerk authentication for protected routes
    return ClerkExpressRequireAuth()(req, res, next);
  }
};

// Middleware that attaches user data but doesn't require authentication
export const attachUserMiddleware = ClerkExpressWithAuth();

// Middleware to catch and format authentication errors
export const authErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied'
    });
  }
  
  next(err);
};