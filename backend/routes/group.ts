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

// Create group (add subscriptionType and personalType, backward compatible)
router.post('/create', async (request: Request, response: Response) => {
  try {
    const { groupName, subscriptionName, subscriptionId, planName, amount, category, cycleDays, userId, subscriptionType, personalType } = request.body;

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
          category,
          totalMem: 1,
          amountEach: parseFloat(parseFloat(amount).toFixed(2)),
          startDate,
          endDate: nextPaymentDate,
          subscriptionType: subscriptionType || 'shared',
          personalType: (subscriptionType === 'personal') ? (personalType || 'existing') : null
        },
        include: {
          subscription: true // Include subscription data in response
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
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true
          }
        },
        subscription: true // Add this line
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

// Update credentials (leader for shared, sole member for personal, backward compatible)
router.put('/:groupId/credentials', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    const { credentialUsername, credentialPassword, userId } = request.body;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    if (!group) {
      return response.status(404).json({ message: 'Group not found' });
    }
    if (group.subscriptionType === 'personal') {
      // Only the sole member can update
      const isSoleMember = group.members.length === 1 && group.members[0].userId === userId;
      if (!isSoleMember) {
        return response.status(403).json({ message: 'Only the owner of the personal group can update credentials' });
      }
    } else {
      // Only leader can update
      const memberRole = await prisma.groupMember.findFirst({
        where: { groupId, userId, userRole: 'leader' }
      });

      if (!memberRole) {
        return response.status(403).json({ message: 'Only group leaders can update credentials' });
      }
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

// Get subscription details for a group
router.get('/:groupId/subscription-details', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        subscription: true
      }
    });

    if (!group) {
      return response.status(404).json({ message: 'Group not found' });
    }

    response.status(200).json({
      ...group,
      credentials: group.credentialUsername && group.credentialPassword ? {
        username: group.credentialUsername,
        password: group.credentialPassword
      } : null
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    response.status(500).json({ message: 'Error fetching subscription details' });
  }
});

// Get user role in a group
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
    console.error('Error fetching user role:', error);
    response.status(500).json({ message: 'Error fetching user role' });
  }
});

export default router;
