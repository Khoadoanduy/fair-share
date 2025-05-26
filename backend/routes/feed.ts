import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';

const router: Router = express.Router();

// Get friend subscription feed
router.get('/subscriptions/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Get user's friends
        const friends = await prisma.friend.findMany({
            where: { userId },
            select: { friendId: true }
        });

        const friendIds = friends.map(f => f.friendId);

        // Get user's current groups to exclude them
        const userGroups = await prisma.groupMember.findMany({
            where: { userId },
            select: { groupId: true }
        });

        const userGroupIds = userGroups.map(g => g.groupId);

        // Get groups that friends are in but user is not
        const friendGroups = await prisma.groupMember.findMany({
            where: {
                userId: { in: friendIds },
                groupId: { notIn: userGroupIds }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                },
                group: true
            }
        });

        // Format for feed display
        const feed = friendGroups.map(item => ({
            id: item.id,
            friend: item.user,
            group: item.group,
            message: `${item.user.firstName} has subscribed to ${item.group.subscriptionName}. Want to join?`
        }));

        res.json(feed);
    } catch (error) {
        console.error('Error fetching subscription feed:', error);
        res.status(500).json({ error: 'Failed to fetch subscription feed' });
    }
});

// Endpoint to create fake subscriptions - FOR TESTING ONLY
router.post('/test-subscription', async (req: Request, res: Response) => {
    try {
        const { friendId, subscriptionName, amount } = req.body;

        // Create test group/subscription
        const group = await prisma.group.create({
            data: {
                groupName: `${subscriptionName} Group`,
                subscriptionName,
                amount,
                cycle: "monthly"
            }
        });

        // Add friend to this group
        await prisma.groupMember.create({
            data: {
                userId: friendId,
                groupId: group.id
            }
        });

        res.status(201).json({
            success: true,
            message: `Created test subscription for friend ID: ${friendId}`,
            group
        });
    } catch (error) {
        console.error('Error creating test subscription:', error);
        res.status(500).json({ error: 'Failed to create test subscription' });
    }
});

export default router;