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
router.post('/create', async (request: Request, response: Response) => {
  try {
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle, category, cycleDays, userId } = request.body;

    if (!groupName || !subscriptionName || !amount || !userId) {
      return response.status(400).json({ message: 'Missing required fields' });
    }

    // Use a transaction to ensure both group and membership are created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the group
      const newGroup = await tx.group.create({
        data: {
          groupName,
          subscriptionName,
          subscriptionId,
          planName,
          amount: parseFloat(amount),
          cycleDays,
          category,
          totalMem: 1,
          amountEach: parseFloat(amount)
        }
      });

      // Automatically add the creator as leader
      const groupMember = await tx.groupMember.create({
        data: {
          userId: userId,
          groupId: newGroup.id,
          userRole: "leader"
        }
      });

      return { group: newGroup, membership: groupMember };
    });

    response.status(201).json({
      message: 'Group created successfully with leader',
      group: result.group.groupName,
      groupId: result.group.id,
      nextPaymentDate: nextPaymentDate
    });

  } catch (error) {
    console.error('Error creating group:', error);
    response.status(500).json({ message: 'Error creating group' });
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
      return response.status(404).json({ message: "No group found" });
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
      return response.status(404).json({ message: "No group found" });
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

//Get group leader
router.get('/leader/:groupId', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    if (!groupId) {
      return response.status(400).json({ message: 'groupId are required' });
    }
    const group = await prisma.groupMember.findFirst({
      where: { 
        groupId: groupId,
        userRole: "leader" 
      },
      include: {
        user: true
      }
    })
    if (!group)
      return response.status(404).json({ message: "No group found" });
    response.status(200).json(group.user);

  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Error getting group leader' });
  }
});

export default router
