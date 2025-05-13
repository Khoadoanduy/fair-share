import { clerkClient } from '@clerk/clerk-sdk-node';
import { db } from '../utils/db.server';
import { CreateUserInput } from '../src/types/user';
import { createUser } from '../src/lib/user';

async function syncExistingUsers() {
  try {
    const clerkUsers = await clerkClient.users.getUserList();
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    for (const user of clerkUsers) {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { clerkId: user.id }
      });
      
      if (!existingUser) {
        // Get phone number if available
        const phoneNumbers = user.phoneNumbers || [];
        const phoneNumber = phoneNumbers.length > 0 ? phoneNumbers[0].phoneNumber : undefined;
        
        // Format user data according to your type definition
        const userData: CreateUserInput = {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        };
        
        // Only add phoneNumber if it exists - this is the key fix!
        if (phoneNumber) {
          userData.phoneNumber = phoneNumber;
        }
        
        // Use your createUser function
        try {
          const result = await createUser(userData);
          
          if (result.user) {
            console.log(`Created user ${result.user.id} for Clerk ID ${user.id}`);
          } else {
            console.error(`Failed to create user for ${user.id}:`, result.error);
          }
        } catch (error) {
          console.error(`Error creating user for ${user.id}:`, error);
        }
      } else {
        console.log(`User ${user.id} already exists, skipping`);
      }
    }
    
    console.log('User sync completed');
  } catch (error) {
    console.error('Error syncing users:', error);
  }
}

syncExistingUsers()
  .then(() => console.log('Done!'))
  .catch(console.error);