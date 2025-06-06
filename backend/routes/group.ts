import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate the next payment date
const calculateNextPaymentDate = (cycle: string, cycleDays: number): Date => {
  const today = new Date();
  const nextPaymentDate = new Date(today);
  
  // Add the appropriate number of days based on the cycle
  nextPaymentDate.setDate(today.getDate() + cycleDays);
  
  return nextPaymentDate;
};

//Create group
router.post('/create', async function (request, response) {
  try {
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle, category, cycleDays } = request.body;    

    // Calculate the start date (today) and next payment date
    const startDate = new Date();
    const nextPaymentDate = calculateNextPaymentDate(cycle, cycleDays);

    const group = await prisma.group.create({
      data: {
        groupName,
        subscriptionId,
        subscriptionName, // Required for all groups
        planName,
        amount,
        cycle,
        category,
        cycleDays,
        amountEach: amount,
        totalMem: 1,
        startDate,
        endDate: nextPaymentDate // Using endDate field to store the next payment date
      }
    });
    response.status(201).json({
      message: 'Group created successfully',
      group: groupName,
      groupId: group.id,
      nextPaymentDate: nextPaymentDate
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

//Get group details
router.get('/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId is required' });
        }
        
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        });
        
        if (!group) {
            return response.status(404).json({ message: 'Group not found' });
        }
        
        // Calculate days until next payment
        let daysUntilNextPayment = 0;
        let nextPaymentDate = null;
        
        if (group.endDate) {
            nextPaymentDate = group.endDate;
            const today = new Date();
            const diffTime = Math.abs(nextPaymentDate.getTime() - today.getTime());
            daysUntilNextPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        response.status(200).json({
            ...group,
            daysUntilNextPayment,
            nextPaymentDate
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting group details' });
    }
});

export default router
