import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Retrieves user information from Clerk by user ID
 * @param userId - The Clerk user ID
 * @returns The user information or null if not found
 */
export async function getUserInfo(userId: string) {
  try {
    // Fetch the user from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    // Return relevant user information
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Error fetching user from Clerk:', error);
    return null;
  }
}