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

// Get subscription details for a group
router.get('/:groupId/subscription-details', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;

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

    // Calculate next payment date based on cycle and start date
    const calculateNextPaymentDate = (startDate: Date | null, cycle: string | null): string => {
      if (!startDate || !cycle) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString().split('T')[0];
      }

      const nextPayment = new Date(startDate);
      switch (cycle.toLowerCase()) {
        case 'weekly':
          nextPayment.setDate(nextPayment.getDate() + 7);
          break;
        case 'monthly':
          nextPayment.setMonth(nextPayment.getMonth() + 1);
          break;
        case 'yearly':
          nextPayment.setFullYear(nextPayment.getFullYear() + 1);
          break;
        default:
          nextPayment.setMonth(nextPayment.getMonth() + 1);
      }

      return nextPayment.toISOString().split('T')[0];
    };

    const subscriptionDetails = {
      id: group.id,
      groupName: group.groupName,
      subscriptionName: group.subscriptionName,
      planName: group.planName,
      amount: group.amount,
      cycle: group.cycle,
      currency: 'USD',
      nextPaymentDate: calculateNextPaymentDate(group.startDate, group.cycle),
      subscription: group.subscription,
      credentials: {
        username: 'placeholder@example.com',
        password: 'placeholder123'
      }
    };

    response.status(200).json(subscriptionDetails);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    response.status(500).json({ message: 'Error fetching subscription details' });
  }
});

export default router