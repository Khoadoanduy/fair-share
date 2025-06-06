import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

//Create group
router.post('/create', async function (request, response) {
  try {
    console.log("create group called")
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle } = request.body;    

    const group = await prisma.group.create({
      data: {
        groupName,
        subscriptionId,  // This is optional and might be null for custom subscriptions
        subscriptionName, // Required for all groups
        planName,
        amount,
        cycle,
        amountEach: amount,
        totalMem: 1
      }
    });
    response.status(201).json({
      message: 'Group created successfully',
      group: groupName,
      groupId: group.id
    });
  } catch (err) {
     console.error(err);
    response.status(500).json({ message: 'An error occurred while creating the group' });
  }
});

//Search user using username
router.get('/search-user/:username', async (request, response) => {
    try {
        const { username } = request.params;

        const users = await prisma.user.findMany({
            where: { 
              username: {
                contains: username,
                mode: 'insensitive'
              }
             },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
            }
        })

        //If user doesn't exist, give an empty list
        if (users.length === 0) {
            return response.status(404).json({ users: [] });
        }
        response.status(200).json({ users });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Error searching user' });
    }
});

//Show all pending invitations for a group
router.get('/invitation/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId are required' });
        }
        //Check if the user has already been invited to this group
        const invitation = await prisma.groupInvitation.findMany({
          where: { groupId },
          include: { user: true }
        })
        if (invitation.length == 0) {
          return response.status(409).json({ message: 'No invitation sent' });
        }
        response.status(200).json(invitation);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting invitation' });
    }
});

//Get amount each member has to pay
router.get('/amount-each/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId are required' });
        }
        const group = await prisma.group.findFirst({
          where: { id: groupId },
        });
        if (!group)
          return response.status(404).json({message: "No group found"});
        response.status(200).json(group.amountEach);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting amount' });
    }
});

//Get the number of members in the group
router.get('/total-mem/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId are required' });
        }
        const group = await prisma.group.findFirst({
          where: { id: groupId },
        })
        if (!group)
          return response.status(404).json({message: "No group found"});
        response.status(200).json(group.totalMem);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting total number of members' });
    }
});

export default router