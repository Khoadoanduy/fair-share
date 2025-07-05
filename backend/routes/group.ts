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
    const { groupName, subscriptionName, subscriptionId, planName, amount, cycle, category, cycleDays, userId, subscriptionType, personalType, visibility, maxMember } = request.body;

    if (!groupName || !subscriptionName || !amount || !userId) {
      return response.status(400).json({ message: 'Missing required fields' });
    }

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
          maxMember,
          amountEach: parseFloat(parseFloat(amount).toFixed(2)),
          visibility: visibility || 'friends', 
          subscriptionType: subscriptionType || 'shared',
          personalType: (subscriptionType === 'personal') ? (personalType || 'existing') : "N/A"
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
        },
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

// Get group details 
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
          include: { user: true }
        },
        subscription: true
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
    const subscriptionDetails = {
      id: group.id,
      groupName: group.groupName,
      subscriptionName: group.subscriptionName,
      planName: group.planName,
      amount: group.amount,
      amountEach: group.amountEach,
      cycle: group.cycle,
      totalMem: group.totalMem,
      currency: 'USD',
      nextPaymentDate: nextPaymentDate?.toISOString().split('T')[0],
      cycleDays: group.cycleDays,
      category: group.category,
      maxMember: group.maxMember,
      amountEach: group.amountEach,
      virtualCardId: group.virtualCardId,
      subscription: group.subscription ? {
        id: group.subscription.id,
        name: group.subscription.name,
        logo: group.subscription.logo,
        domain: group.subscription.domain,
        category: group.subscription.category
      } : null,
      credentials: group.credentialUsername && group.credentialPassword ? {
        username: group.credentialUsername,
        password: group.credentialPassword
      } : null,
      members: group.members,
      daysUntilNextPayment
    };

    response.status(200).json(subscriptionDetails);
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

//Show all pending invitations for a group
router.get('/invitation/:groupId', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    if (!groupId) {
      return response.status(400).json({ message: 'groupId are required' });
    }
    //Get all pending invitations for this group
    const invitation = await prisma.groupInvitation.findMany({
      where: {
        groupId,
        status: "pending",
        type: "invitation"
      },
      include: { user: true }
    })

    // Always return the array, even if empty
    response.status(200).json(invitation);

  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Error getting invitation' });
  }
});

// Get amount each member has to pay
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

// Get join requests for a group
router.get('/join-requests/:groupId', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    if (!groupId) {
      return response.status(400).json({ message: 'groupId is required' });
    }

    // Fetch pending join requests for this group
    const joinRequests = await prisma.groupInvitation.findMany({
      where: {
        groupId,
        status: "pending",
        type: "join_request"
      },
      include: { user: true }
    });

    response.status(200).json(joinRequests);

  } catch (error) {
    console.error('Error fetching join requests:', error);
    response.status(500).json({ message: 'Error getting join requests' });
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
//Start cycle as of today
router.put('/start-cycle/:groupId', async (request, response) => {
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
    await prisma.group.update({
        where: { id: groupId },
        data: { startDate: new Date() }
    });
    response.status(200).json(group.startDate);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Error starting cycle' });
  }
});

export default router