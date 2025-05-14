import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

router.post('/create', async (req, res) => {
  try {
    const { firstName, lastName, username, email, clerkId } = req.body;

    // Save the user to the database
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        firstName,
        lastName,
        username,
        email,
      }
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/create-group', async function (request, response) {
  try {
    console.log("create group called")
    //const creatorId = request.user.id; //should build a middleware for this
    const { groupName, subscriptionName, planName, amount, virtualCardId, 
        members, cycle, startDate, endDate, status } = request.body;    

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
        status: status || 'active'
      }
    });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: ''
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
        console.log(username)

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
                email: true
            }
        })

        //If user doesn't exist
        if (users.length === 0) {
            return response.status(404).json({ users: [] });
        }
        response.status(200).json({ users });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: 'Error searching user' });
    }
})

// Invite users to a group (both pending and existing groups)
router.post('/invite', async (request: Request, response: Response) => {
    try {
        const { userId, groupName, subscriptionName, planName, amount, cycle, startDate, endDate, virtualCardId, groupId, status } = request.body;

        // If groupId is provided, invite the user to an existing group
        if (groupId) {
            // Check if the group exists
            const existingGroup = await prisma.group.findUnique({
                where: { id: groupId },
            });

            if (!existingGroup) {
                return response.status(404).json({ message: 'Group not found' });
            }

            // Create an invitation for the existing group
            const invitation = await prisma.groupInvitation.create({
                data: {
                    userId,
                    groupId,
                    status: 'pending', // Pending until user accepts
                },
            });

            return response.status(200).json({ message: 'Invitation sent to existing group', invitation });

        } else {
            // If no groupId is provided, create a "pending" group
            const pendingGroup = await prisma.group.create({
                data: {
                    groupName,
                    subscriptionName,
                    planName,
                    amount,
                    cycle,
                    startDate,
                    endDate,
                    virtualCardId,
                    status: 'pending',  // Mark as pending
                },
            });

            // Create the invitation to the pending group
            const invitation = await prisma.groupInvitation.create({
                data: {
                    userId,
                    groupId: pendingGroup.id,  // Link to the pending group
                    status: 'pending',         // Mark as pending
                },
            });

            return response.status(200).json({ message: 'Invitation sent to pending group', invitation });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error sending invitation' });
    }
});

export default router