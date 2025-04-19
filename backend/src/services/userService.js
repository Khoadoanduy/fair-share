import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/errorHandler.js';

/**
 * Service for user-related operations
 */
export const userService = {
  /**
   * Find or create a user based on Clerk authentication
   * @param {Object} userData - User data from Clerk
   * @returns {Promise<Object>} - The user object
   */
  async findOrCreateUser(userData) {
    const { id: clerkId, email, fullName } = userData;
    
    if (!clerkId || !email) {
      throw new ApiError(400, 'Missing required user data');
    }
    
    // Split full name into first and last name
    let firstName = '';
    let lastName = '';
    
    if (fullName) {
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    try {
      // Try to find the user first
      let user = await prisma.user.findUnique({
        where: { clerkId },
      });
      
      // If user doesn't exist, create a new one
      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId,
            email,
            firstName,
            lastName,
          },
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw new ApiError(500, 'Failed to process user data');
    }
  },
  
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - The user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error in getUserProfile:', error);
      throw new ApiError(500, 'Failed to retrieve user profile');
    }
  },
  
  /**
   * Get user by Clerk ID
   * @param {string} clerkId - Clerk user ID
   * @returns {Promise<Object>} - The user object
   */
  async getUserByClerkId(clerkId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
      });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error in getUserByClerkId:', error);
      throw new ApiError(500, 'Failed to retrieve user');
    }
  },
};