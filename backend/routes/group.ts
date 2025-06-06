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
        subscriptionId,
        subscriptionName,
        planName,
        amount,
        cycle,
        startDate: new Date(),
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

// Add credentials to group (leader only)
router.put('/:groupId/credentials', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    const { credentialUsername, credentialPassword, userId } = request.body;

    // Validate ObjectID format
    if (!groupId || groupId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(groupId)) {
      return response.status(400).json({ message: 'Invalid group ID format' });
    }

    // Check if user is the leader of this group
    const memberRole = await prisma.groupMember.findFirst({
      where: { groupId, userId, userRole: 'leader' }
    });

    if (!memberRole) {
      return response.status(403).json({ message: 'Only group leaders can update credentials' });
    }

    await prisma.group.update({
      where: { id: groupId },
      data: {
        credentialUsername,
        credentialPassword
      }
    });

    response.status(200).json({ message: 'Credentials updated successfully' });
  } catch (error) {
    console.error('Error updating credentials:', error);
    response.status(500).json({ message: 'Error updating credentials' });
  }
});

// Check user role in group
router.get('/:groupId/user-role/:userId', async (request: Request, response: Response) => {
  try {
    const { groupId, userId } = request.params;

    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId }
    });

    if (!member) {
      return response.status(404).json({ message: 'User not found in group' });
    }

    response.status(200).json({ role: member.userRole });
  } catch (error) {
    console.error('Error checking user role:', error);
    response.status(500).json({ message: 'Error checking user role' });
  }
});

// Get subscription details for a group
router.get('/:groupId/subscription-details', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;

    // Validate ObjectID format
    if (!groupId || groupId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(groupId)) {
      return response.status(400).json({ message: 'Invalid group ID format' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        subscription: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
            domain: true
          }
        }
      }
    });

    if (!group) {
      return response.status(404).json({ message: 'Group not found' });
    }

    const subscriptionDetails = {
      id: group.id,
      groupName: group.groupName,
      subscriptionName: group.subscriptionName,
      planName: group.planName,
      amount: group.amount,
      cycle: group.cycle,
      currency: 'USD',
      nextPaymentDate: '', // Left blank as requested
      subscription: group.subscription,
      credentials: group.credentialUsername && group.credentialPassword ? {
        username: group.credentialUsername,
        password: group.credentialPassword
      } : null
    };

    response.status(200).json(subscriptionDetails);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    response.status(500).json({ message: 'Error fetching subscription details' });
  }
});

export default router