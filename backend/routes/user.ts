import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';

const router: Router = express.Router();

/**
 * GET /?clerkID=xxx - Get user by clerk ID (query parameter)
 */
router.get('/', async function(request, response) {
  const clerkID = request.query.clerkID as string;
  
  if (!clerkID) {
    return response.status(400).send("clerkID is required");
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkID
      },
    });
    
    if (!user) {
      response.status(404).send("User not found");
    } else {
      response.json(user);
    }
  } catch (error) {
    console.error('Error loading user:', error);
    response.status(500).send("Server error");
  }
});

/**
 * PUT /:clerkID - Update user by clerk ID (URL parameter)
 */
router.put('/:clerkID', async function(request, response) {
  const clerkID = request.params.clerkID as string;
  const { phoneNumber, address } = request.body;
  
  try {
    // Validate phone number if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return response.status(400).send("Invalid phone number format");
    }
    
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkID
      },
    });
    
    if (!user) {
      response.status(404).send("User not found");
    } else {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { 
          phoneNumber, 
          address 
        }
      });
      response.json(updated);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    response.status(500).send("Server error");
  }
});

export default router;