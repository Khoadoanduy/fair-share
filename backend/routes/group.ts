import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate the next payment date
const calculateNextPaymentDate = (cycleDays: number, startDate?: Date | null): Date => {
  const baseDate = startDate || new Date();
  const nextPaymentDate = new Date(baseDate);
  nextPaymentDate.setDate(baseDate.getDate() + cycleDays);
  return nextPaymentDate;
};

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Create group
router.post('/create', async (request: Request, response: Response) => {
  try {
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle, category, cycleDays, userId } = request.body;

    if (!groupName || !subscriptionName || !amount || !userId) {
      return response.status(400).json({ message: 'Missing required fields' });
    }

    const startDate = new Date();
    const nextPaymentDate = calculateNextPaymentDate(cycleDays, startDate);
    const daysUntilNextPayment = cycleDays;

    const result = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          groupName,
          subscriptionName,
          subscriptionId,
          planName,
          amount: parseFloat(amount),
          cycleDays: cycleDays ? parseInt(cycleDays) : null,
          cycle,
          category,
          totalMem: 1,
          amountEach: parseFloat(parseFloat(amount).toFixed(2)),
          startDate,
          endDate: nextPaymentDate
        }
      });

      const groupMember = await tx.groupMember.create({
        data: {
          userId,
          groupId: newGroup.id,
          userRole: "leader"
        }
      });

      return { group: newGroup, membership: groupMember };
    });

    response.status(201).json({
      message: 'Group created successfully with leader',
      groupId: result.group.id,
      startDate: startDate.toISOString().split('T')[0],
      nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
      daysUntilNextPayment
    });

  } catch (error) {
    console.error('Error creating group:', error);
    response.status(500).json({ message: 'Error creating group' });
  }
});

// Search users
router.get('/search-user/:username', async (request: Request, response: Response) => {
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
    });

    response.status(200).json({ users: users.length ? users : [] });
  } catch (error) {
    console.error('Error searching users:', error);
    response.status(500).json({ message: 'Error searching users' });
  }
});

// Get group details with members
router.get('/:groupId', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    if (!groupId) {
      return response.status(400).json({ message: 'groupId is required' });
    }
    
    const group = await prisma.group.findUnique({
      where: { id: groupId, status: "pending" },
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
    
    const today = new Date();
    let nextPaymentDate = group.endDate;
    let daysUntilNextPayment = 0;

    if (group.startDate && group.cycleDays) {
      nextPaymentDate = calculateNextPaymentDate(group.cycleDays, group.startDate);
      
      if (nextPaymentDate < today) {
        const daysSinceStart = calculateDaysBetween(group.startDate, today);
        const cyclesPassed = Math.floor(daysSinceStart / group.cycleDays);
        nextPaymentDate = new Date(group.startDate);
        nextPaymentDate.setDate(group.startDate.getDate() + (cyclesPassed + 1) * group.cycleDays);
      }
      
      daysUntilNextPayment = calculateDaysBetween(today, nextPaymentDate);
      
      await prisma.group.update({
        where: { id: groupId },
        data: { endDate: nextPaymentDate }
      });
    }
    
    response.status(200).json({
      ...group,
      daysUntilNextPayment,
      nextPaymentDate: nextPaymentDate?.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Error getting group details' });
  }
});

// Update credentials (leader only)
router.put('/:groupId/credentials', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    const { credentialUsername, credentialPassword, userId } = request.body;

    const memberRole = await prisma.groupMember.findFirst({
      where: { groupId, userId, userRole: 'leader' }
    });

    if (!memberRole) {
      return response.status(403).json({ message: 'Only group leaders can update credentials' });
    }

    await prisma.group.update({
      where: { id: groupId },
      data: { credentialUsername, credentialPassword }
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
                },
                subscription: true
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
