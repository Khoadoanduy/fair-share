import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';
import { getTimeAgoFromObjectId } from '../utils/timeUtils';

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

        // First, get all groups that actually exist
        const existingGroups = await prisma.group.findMany({
            select: { id: true }
        });
        const existingGroupIds = existingGroups.map(g => g.id);

        // Get groups that friends are in but user is not - REMOVE visibility filter
        const friendGroups = await prisma.groupMember.findMany({
            where: {
                userId: { in: friendIds },
                groupId: {
                    notIn: userGroupIds,
                    in: existingGroupIds
                },
                group: {
                    subscriptionType: {
                        not: 'personal'
                    }
                }
            },
            include: {
                user: true,
                group: { 
                    include: { 
                        subscription: true 
                    } 
                }
            },
            orderBy: {
                id: 'desc' // Use id instead of createdAt
            }
        });

        // Filter out groups where user has been invited BEFORE mapping
        const eligibleGroups = [];
        for (const item of friendGroups) {
            // Check if current user has been invited to this group
            const existingInvitation = await prisma.groupInvitation.findFirst({
                where: {
                    userId: userId,
                    groupId: item.group.id,
                    type: 'invitation'
                }
            });

            // Only include groups where user has NOT been invited
            if (!existingInvitation) {
                eligibleGroups.push(item);
            }
        }

        // Format for feed display
        const feed = await Promise.all(eligibleGroups.map(async (item) => {
            // Skip if item or required properties are null
            if (!item || !item.user || !item.group) {
                return null;
            }

            // Check if current user has already requested to join this group
            const existingRequest = await prisma.groupInvitation.findFirst({
                where: {
                    userId: userId,
                    groupId: item.group.id,
                    type: 'join_request'
                }
            });

            return {
                id: item.id,
                friend: item.user,
                group: {
                    ...item.group,
                    timeAgo: getTimeAgoFromObjectId(item.id)
                },
                message: `${item.user.firstName} has subscribed to ${item.group.subscriptionName}. Want to join?`,
                hasRequested: !!existingRequest,
                requestStatus: existingRequest?.status || null
            };
        }));

        // Filter out null values
        const validFeed = feed.filter(item => item !== null);

        res.json(validFeed);
    } catch (error) {
        console.error('Error fetching subscription feed:', error);
        res.status(500).json({ error: 'Failed to fetch subscription feed' });
    }
});

export default router;