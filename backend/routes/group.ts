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
    const { groupName, subscriptionName, planName, amount, cycle } = request.body;    

    const group = await prisma.group.create({
      data: {
        groupName,
        subscriptionName,
        planName,
        amount,
        cycle,
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
})

// Invite users to a group
router.post('/:groupId/invite/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Check if the user has already been invited to this group
        const existingInvitation = await prisma.groupInvitation.findFirst({
          where: { 
            groupId, 
            userId, 
            status: { in: ['pending', 'accepted']} }
        })
        if (existingInvitation) {
          return response.status(409).json({ message: 'User already invited' });
        }
        const invitation = await prisma.groupInvitation.create({
          data: {
            groupId,
            userId,
            status: 'pending'
          }
        })
        response.status(200).json({ message: 'Successful invitation' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error sending invitation' });
    }
});

export default router