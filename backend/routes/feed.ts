import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';

const router: Router = express.Router();

// Get friend subscription feed
router.get('/subscriptions/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Get user's friends (both directions of friendship)
        const friends = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { friendId: userId }
                ]
            },
            select: { 
                userId: true,
                friendId: true 
            }
        });

        // Extract friend IDs (excluding the current user)
        const friendIds = friends.map(f => 
            f.userId === userId ? f.friendId : f.userId
        ).filter(id => id !== userId);

        if (friendIds.length === 0) {
            return res.json([]);
        }

        // Get user's current groups to exclude them from feed
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
                group: {
                    select: {
                        id: true,
                        groupName: true,
                        subscriptionName: true,
                        amount: true,
                        cycleDays: true,
                        category: true
                    }
                }
            },
            orderBy: {
                id: 'desc' // Show most recent activities first
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

export default router;