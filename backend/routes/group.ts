import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

router.post('/create-group', async function (request, response) {
  try {
    console.log("create group called")
    //const creatorId = request.user.id; //should build a middleware for this
    const { groupName, subscriptionName, planName, amount, virtualCardId, 
        members, cycle, startDate, endDate, creatorId } = request.body;    

    const group = await prisma.group.create({
      data: {
        groupName,
        subscriptionName,
        planName,
        amount,
        virtualCardId,
        cycle,
        startDate,
        endDate,
      }
    });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: creatorId,
      }
    });

    response.status(201).json({
      message: 'Group created successfully',
      group,
    });

  } catch (err) {
     console.error(err);
    response.status(500).json({ message: 'An error occurred while creating the group' });
  }
});

router.get('/search-user/:username', async (request, response) => {
    try {
        const { username } = request.params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true
            }
        })

        //If user doesn't exist
        if (!user) {
            return response.status(404).json({ message: 'User not found' });
        }
        response.status(200).json({ user });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Error searching user' });
    }
})

router.post('/:groupId/invite', async (request, response) => {
    try {
        const { userId } = request.body;
        const { groupId } = request.params;

        //Check if the invitation is already invited
        const existingInvitation = await prisma.groupInvitation.findFirst({
            where: { userId, groupId, status: 'pending' }
        });

        if (existingInvitation) {
            return response.status(400).json({ message: 'Already invited' });
        }

        //Create invitation
        const invitation = await prisma.groupInvitation.create({
            data: { userId, groupId }
        });

        response.status(200).json({ message: 'Invitation sent', invitation });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Error sending invitation' });
    }
});

export default router