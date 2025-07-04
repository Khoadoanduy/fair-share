import express, { Request, Response, Router, response } from 'express';
import { User } from '@prisma/client';
import prisma from '../prisma/client';
import { getTimeAgoFromObjectId } from '../utils/timeUtils';

const router: Router = express.Router();

router.get('/', async function (request, response) {
    try {
        const clerkID = request.query.clerkID as string;
        const user = await prisma.user.findUnique({
            where: {
                clerkId: clerkID,
            },
        });
        if (!user) {
            return response.status(430).send("User not found");
        }
        return response.json(user);
    } catch (error) {
        console.error("Error retrieving user:", error);
        response.status(500).send("Internal Server Error");
    }
});

router.put('/:clerkID', async function (request, response) {
    const clerkID = request.params.clerkID as string;
    const { phoneNumber, dateOfBirth, customerId } = request.body;

    try {
        const updated = await prisma.user.update({
            where: { clerkId: clerkID },
            data: {
                phoneNumber: phoneNumber || undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                customerId: customerId || undefined,
            },
        });
        response.json(updated);
    } catch (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Failed to update user' });
    }
});
router.put('/:clerkID/:customerId', async function (request, response) {
    const clerkID = request.params.clerkID as string;
    const cusomter = request.params.customerId as string;
    console.log(cusomter)

    try {
        const updated = await prisma.user.update({
            where: { clerkId: clerkID },
            data: {
                customerId: cusomter ? cusomter : undefined, // Set cusomterId only if it's provided in the request body
            },
        });
        response.json(updated);
    } catch (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Failed to update user' });
    }
});

//Show all invitation of one user
router.get('/invitation/:userId', async (request: Request, response: Response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({ message: 'userId is required' });
        }

        // Get all pending invitations for this user (only received invitations, not sent requests)
        const invitations = await prisma.groupInvitation.findMany({
            where: {
                userId,
                status: "pending",
                type: "invitation"
            },
            include: {
                group: {
                    include: {
                        subscription: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        response.status(200).json(invitations);

    } catch (error) {
        console.error('Error fetching invitations:', error);
        response.status(500).json({ message: 'Error fetching invitations' });
    }
});

//Show all user's groups (with optional subscriptionType filter)
router.get('/groups/:userId', async (request: Request, response: Response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({ message: 'userId are required' });
        }
        // Get user's groups with subscription info
        const allGroups = await prisma.groupMember.findMany({
            where: { userId },
            include: { 
                group :{
                    include: {
                        subscription : {
                            select: {
                                logo: true
                            }
                        }
                    }
                }
              } 
        });

        if (allGroups.length === 0) {
            return response.json([]);
        }

        const formattedGroups = allGroups.map(member => ({
            ...member.group, 
            logo: member.group.subscription?.logo,
            subscription: undefined
          }));

        response.status(200).json(formattedGroups);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting groups' });
    }
});

router.get('/find-subs-by-category/:userId/:category', async (request: Request, response: Response) => {
    try {
        const { userId, category } = request.params;

        if (!userId || !category) {
            return response.status(400).json({ message: 'userId and category are required' });
        }

        const allGroups = await prisma.groupMember.findMany({
            where: {
                userId: userId,
            },
            include: { 
                group :{
                    include: {
                        subscription : {
                            select: {
                                logo: true
                            }
                        }
                    }
                }
              }
        });
        const formattedGroups = allGroups.map(member => ({
            ...member.group, 
            logo: member.group.subscription?.logo,
            subscription: undefined
          }));
        
        const categorySubscriptions = formattedGroups
            .filter(member => member.category === category)

        response.status(200).json(categorySubscriptions);

    } catch (error) {
        console.error('Error finding subscriptions by category:', error);
        response.status(500).json({ message: 'Error finding subscriptions by category' });
    }
});


router.get('/requests-sent/:userId', async (request: Request, response: Response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({ message: 'userId is required' });
        }

        // Get all join requests sent by the user with group details
        const sentRequests = await prisma.groupInvitation.findMany({
            where: {
                userId,
                status: "pending",
                type: 'join_request'
            },
            include: {
                group: {
                    include: {
                        subscription: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        response.status(200).json(sentRequests);

    } catch (error) {
        console.error('Error fetching sent requests:', error);
        response.status(500).json({ message: 'Error fetching sent requests' });
    }
});

export default router;
