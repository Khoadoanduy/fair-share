import { Router, Request, Response } from 'express';
import { db } from '../utils/db.server';
import { clerkClient } from '@clerk/clerk-sdk-node';

export const UserRoutes = Router();

// Helper for consistent responses
const respond = (res: Response, success: boolean, data?: any, message?: string, status = 200) => {
  res.status(status).json({ success, ...(data && { data }), ...(message && { message }) });
};

// Load current user - keep this middleware as it's specific to user routes
const loadUser = async (req: Request, res: Response, next: Function) => {
  try {
    // We can safely use req.auth.userId because our global authMiddleware guarantees it's present
    console.log('Auth userId:', req.auth.userId);
    const user = await db.user.findUnique({ where: { clerkId: req.auth.userId } });
    console.log('Found user:', user);
    if (!user) return respond(res, false, null, 'User not found', 404);
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Error loading user:', error);
    respond(res, false, null, 'Server error', 500);
  }
};

/**
 * GET /users/me
 * Get current user profile
 */
UserRoutes.get('/userId', loadUser, (req, res) => {
  respond(res, true, req.currentUser);
});

/**
 * PUT /users/me
 * Update user profile without email changes
 */
UserRoutes.put('/userId', loadUser, async (req, res) => {
  try {
    const { phoneNumber, address } = req.body;

    // Validate phone number if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return respond(res, false, null, 'Invalid phone number format', 400);
    }

    // Update user in database
    const updatedUser = await db.user.update({
      where: { id: req.currentUser.id },
      data: { 
        phoneNumber, 
        address 
      }
    });

    respond(res, true, updatedUser, 'Profile updated successfully');
  } catch (error: any) {
    // P2002 is Prisma's error for unique constraint violations - this happens if a user tries to use a phone number that's already registered to another user
    const status = error.code === 'P2002' ? 400 : 500;
    const message = error.code === 'P2002' 
      ? `${error.meta?.target} already in use` 
      : 'Server error';
    respond(res, false, null, message, status);
  }
});

// TypeScript declaration for proper typing
declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
      auth: { userId: string; [key: string]: any };
    }
  }
}
