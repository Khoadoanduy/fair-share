import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate the next payment date
const calculateNextPaymentDate = (cycleDays: number, startDate?: Date | null): Date => {
  // Use startDate if provided, otherwise use today's date
  const baseDate = startDate || new Date();
  const nextPaymentDate = new Date(baseDate);
  
  // Add the appropriate number of days
  nextPaymentDate.setDate(baseDate.getDate() + cycleDays);
  
  return nextPaymentDate;
};

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

//Create group
router.post('/create', async (request: Request, response: Response) => {
  try {
    
    const { groupName, subscriptionName, subscriptionId, planName, amount, category, cycleDays, userId } = request.body;
    console.log(request.body);
    if (!groupName || !subscriptionName || !amount || !userId) {
      return response.status(400).json({ message: 'Missing required fields' });
    }

    // Set the start date to today
    const startDate = new Date();
    
    // Calculate next payment date if cycleDays is provided
    let nextPaymentDate = null;
    let daysUntilNextPayment = 0;
    
    if (cycleDays) {
      const cycleDaysInt = parseInt(cycleDays);
      nextPaymentDate = calculateNextPaymentDate(cycleDaysInt, startDate);
      
      // Calculate days until next payment (should be equal to cycleDays for a new group)
      daysUntilNextPayment = cycleDaysInt;
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
          cycleDays: cycleDays ? parseInt(cycleDays) : null,
          category,
          totalMem: 1,
          amountEach: parseFloat(parseFloat(amount).toFixed(2)),
          // Set startDate to today
          startDate: startDate,
          // Set endDate as the next payment date if calculated
          endDate: nextPaymentDate
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

    // Format the dates for the response
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedNextPaymentDate = nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null;
    
    response.status(201).json({
      message: 'Group created successfully with leader',
      group: result.group.groupName,
      groupId: result.group.id,
      startDate: formattedStartDate,
      nextPaymentDate: formattedNextPaymentDate,
      daysUntilNextPayment: daysUntilNextPayment
    });

  } catch (error) {
    console.error('Error creating group:', error);
    response.status(500).json({ message: 'Error creating group' });
  }
});

//Search user using username
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

    // Calculate next payment date and days until next payment
    let nextPaymentDate = '';
    let daysUntilNextPayment = 0;
    const today = new Date();
    
    // First check if endDate exists
    if (group.endDate) {
      nextPaymentDate = group.endDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      daysUntilNextPayment = calculateDaysBetween(today, group.endDate);
    }
    // If no endDate but both startDate and cycleDays exist, calculate next payment date
    else if (group.startDate && group.cycleDays) {
      // Calculate the next payment date based on startDate
      let nextDate = calculateNextPaymentDate(group.cycleDays, group.startDate);
      
      // If the calculated date is in the past, recalculate based on today
      if (nextDate < today) {
        // Calculate how many payment cycles have passed
        const daysSinceStart = calculateDaysBetween(group.startDate, today);
        const cyclesPassed = Math.floor(daysSinceStart / group.cycleDays);
        
        // Calculate the next payment date by adding the appropriate number of cycles
        const newStartDate = new Date(group.startDate);
        newStartDate.setDate(group.startDate.getDate() + (cyclesPassed + 1) * group.cycleDays);
        nextDate = newStartDate;
      }
      
      nextPaymentDate = nextDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      daysUntilNextPayment = calculateDaysBetween(today, nextDate);
      
      // Update the group with the calculated endDate
      await prisma.group.update({
        where: { id: groupId },
        data: { endDate: nextDate }
      });
    }
    // If only cycleDays exists (no startDate), calculate based on today
    else if (group.cycleDays) {
      const nextDate = calculateNextPaymentDate(group.cycleDays);
      nextPaymentDate = nextDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      daysUntilNextPayment = calculateDaysBetween(today, nextDate);
      
      // Update the group with today as startDate and the calculated endDate
      await prisma.group.update({
        where: { id: groupId },
        data: { 
          startDate: today,
          endDate: nextDate 
        }
      });
    }

    const subscriptionDetails = {
      id: group.id,
      groupName: group.groupName,
      subscriptionName: group.subscriptionName,
      planName: group.planName,
      amount: group.amount,
      cycleDays: group.cycleDays,
      currency: 'USD',
      nextPaymentDate: nextPaymentDate,
      daysUntilNextPayment: daysUntilNextPayment,
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
    response.status(200).json(group.amountEach?.toFixed(2));

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
        
        // Calculate next payment date and days until next payment
        let daysUntilNextPayment = 0;
        let nextPaymentDate = null;
        const today = new Date();
        
        // First check if endDate exists (for backward compatibility)
        if (group.endDate) {
            nextPaymentDate = group.endDate;
            daysUntilNextPayment = calculateDaysBetween(today, nextPaymentDate);
        } 
        // If no endDate but both startDate and cycleDays exist, calculate next payment date
        else if (group.startDate && group.cycleDays) {
            // Calculate the next payment date based on startDate
            nextPaymentDate = calculateNextPaymentDate(group.cycleDays, group.startDate);
            
            // If the calculated date is in the past, recalculate based on today
            if (nextPaymentDate < today) {
                // Calculate how many payment cycles have passed
                const daysSinceStart = calculateDaysBetween(group.startDate, today);
                const cyclesPassed = Math.floor(daysSinceStart / group.cycleDays);
                
                // Calculate the next payment date by adding the appropriate number of cycles
                const newStartDate = new Date(group.startDate);
                newStartDate.setDate(group.startDate.getDate() + (cyclesPassed + 1) * group.cycleDays);
                nextPaymentDate = newStartDate;
            }
            
            // Calculate days until next payment
            daysUntilNextPayment = calculateDaysBetween(today, nextPaymentDate);
            
            // Update the group with the calculated endDate
            await prisma.group.update({
                where: { id: groupId },
                data: { endDate: nextPaymentDate }
            });
        }
        // If only cycleDays exists (no startDate), calculate based on today
        else if (group.cycleDays) {
            // Calculate the next payment date based on today
            nextPaymentDate = calculateNextPaymentDate(group.cycleDays);
            
            // Calculate days until next payment
            daysUntilNextPayment = calculateDaysBetween(today, nextPaymentDate);
            
            // Update the group with today as startDate and the calculated endDate
            await prisma.group.update({
                where: { id: groupId },
                data: { 
                    startDate: today,
                    endDate: nextPaymentDate 
                }
            });
        }
        
        // Format the nextPaymentDate to a string if it exists
        const formattedNextPaymentDate = nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null;
        
        response.status(200).json({
            ...group,
            daysUntilNextPayment,
            nextPaymentDate: formattedNextPaymentDate
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting group details' });
    }
});

// Update cycle days and recalculate next payment date
router.put('/:groupId/update-cycle', async (request: Request, response: Response) => {
  try {
    const { groupId } = request.params;
    const { cycleDays, userId } = request.body;
    
    if (!groupId || !cycleDays) {
      return response.status(400).json({ message: 'Group ID and cycle days are required' });
    }
    
    // Check if user is the leader of this group
    const memberRole = await prisma.groupMember.findFirst({
      where: { groupId, userId, userRole: 'leader' }
    });

    if (!memberRole) {
      return response.status(403).json({ message: 'Only group leaders can update cycle days' });
    }
    
    // Get the current group to check if startDate exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });
    
    if (!group) {
      return response.status(404).json({ message: 'Group not found' });
    }
    
    const cycleDaysInt = parseInt(cycleDays);
    const today = new Date();
    let nextPaymentDate;
    
    // If startDate exists, calculate next payment date based on it
    if (group.startDate) {
      // Calculate the next payment date based on startDate
      nextPaymentDate = calculateNextPaymentDate(cycleDaysInt, group.startDate);
      
      // If the calculated date is in the past, recalculate based on today
      if (nextPaymentDate < today) {
        // Calculate how many payment cycles have passed
        const daysSinceStart = calculateDaysBetween(group.startDate, today);
        const cyclesPassed = Math.floor(daysSinceStart / cycleDaysInt);
        
        // Calculate the next payment date by adding the appropriate number of cycles
        const newStartDate = new Date(group.startDate);
        newStartDate.setDate(group.startDate.getDate() + (cyclesPassed + 1) * cycleDaysInt);
        nextPaymentDate = newStartDate;
      }
    } else {
      // If no startDate, use today as the base date
      nextPaymentDate = calculateNextPaymentDate(cycleDaysInt);
    }
    
    // Update the group with new cycle days and next payment date
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        cycleDays: cycleDaysInt,
        startDate: group.startDate || today, // Set startDate if it doesn't exist
        endDate: nextPaymentDate
      }
    });
    
    // Calculate days until next payment
    const daysUntilNextPayment = calculateDaysBetween(today, nextPaymentDate);
    
    // Format the nextPaymentDate to a string
    const formattedNextPaymentDate = nextPaymentDate.toISOString().split('T')[0];
    
    response.status(200).json({
      message: 'Cycle days updated successfully',
      cycleDays: cycleDaysInt,
      nextPaymentDate: formattedNextPaymentDate,
      daysUntilNextPayment
    });
    
  } catch (error) {
    console.error('Error updating cycle days:', error);
    response.status(500).json({ message: 'Error updating cycle days' });
  }
});

export default router
