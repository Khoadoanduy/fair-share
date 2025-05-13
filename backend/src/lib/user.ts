import { db } from '../../utils/db.server';import { CreateUserInput } from '../types/user'; 
import { User } from '@prisma/client';

interface GetUserParams {
  id?: string;
  clerkUserId?: string;
}

//  Use CreateUserInput type
async function createUser(data: CreateUserInput) {
  try {
    const user = await db.user.create({ data });    
    return { user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error };
  }
}

export { createUser };
