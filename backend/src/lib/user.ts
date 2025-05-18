import prisma from '../../prisma/client'; 
import { CreateUserInput } from '../types/user'; 
import { User } from '@prisma/client';

interface GetUserParams {
  id?: string;
  clerkUserId?: string;
}

//  Use CreateUserInput type
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

export { createUser };

