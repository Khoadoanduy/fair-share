import prisma from '../../prisma/client'; 
import { CreateUserInput } from '../types/user'; 
import { User } from '@prisma/client';

interface GetUserParams {
  id?: string;
  clerkUserId?: string;
}

// Create a user
async function createUser(data: CreateUserInput) {
  try {
    const user = await prisma.user.create({ data });
    return { user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error };
  }
}

// Update a user
async function updateUser(id: string, data: Partial<CreateUserInput>) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data
    });
    return { user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { error };
  }
}

// Delete a user
async function deleteUser(id: string) {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return { error: 'User not found' };
    }
    
    // Delete the user
    await prisma.user.delete({
      where: { id }
    });
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error };
  }
}

export { createUser, updateUser, deleteUser };