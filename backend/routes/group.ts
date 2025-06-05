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
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle, category } = request.body;    

    const group = await prisma.group.create({
      data: {
        groupName,
        subscriptionId,  // This is optional and might be null for custom subscriptions
        subscriptionName, // Required for all groups
        planName,
        amount,
        cycle,
        category
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

router.get('/search-group/:userId/:groupName', async (request, response) => {
    try {
        const { userId, groupName } = request.params;

        const groups = await prisma.groupMember.findMany({
            where: { 
              userId: userId,
              group: {
                is: {
                  groupName: {
                    contains: groupName,
                    mode: 'insensitive'
                }
              }
             }
            },
            select: {
                group: true
            }
        })

        //If user doesn't exist, give an empty list
        if (groups.length === 0) {
            return response.status(404).json({ groups: [] });
        }
        response.status(200).json({ groups });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Error searching group' });
    }
});

export default router