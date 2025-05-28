
import express, { Request, Response, Router, response } from 'express';
import { User } from '@prisma/client';
import prisma from '../prisma/client';
import { stat } from 'fs';



const router: Router = express.Router();

router.get('/', async function (request,response){
    const clerkID = request.query.clerkID as string;
    const user = await prisma.user.findUnique({
        where:{
            clerkId: clerkID
        },
    })
    if(!user){response.status(401).send("User not found")}
    else response.json(user)
})

router.put('/:clerkID', async function(request, response) {
  const clerkID = request.params.clerkID as string;
  const updateData = request.body;
  
  try {
    // Validate phone number if it's being updated
    if (updateData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(updateData.phoneNumber)) {
      return response.status(400).send("Invalid phone number format");
    }
    
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkID
      },
    });
    
    if (!user) {
      return response.status(404).send("User not found");
    }

    // Update user with any provided fields
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData
      }
    });
    
    response.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    response.status(500).send("Server error");
  }
});


export default router;