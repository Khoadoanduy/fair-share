import prisma from '../../prisma/client';
import { CreateUserInput } from '../types/user';

interface GetUserParams {
  id?: string;
  clerkUserId?: string;
}

// Create a user
async function createUser(data: CreateUserInput) {
  try {
    console.log('Attempting to create user:', data);
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
    // Use transactions to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx: { user: { delete: (arg0: { where: { id: string; }; }) => any; }; }) => {
      const deletedUser = await tx.user.delete({
        where: { id }
      });
      return { success: true, userId: id };
    });

    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export { createUser, updateUser, deleteUser };