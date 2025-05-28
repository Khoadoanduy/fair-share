import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';

const router: Router = express.Router();

// Get all friends for a user
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const friends = await prisma.friend.findMany({
            where: { userId },
            include: {
                friend: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        username: true,
                    }
                }
            }
        });

        res.json(friends.map(f => f.friend));
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

// Send a friend invitation
router.post('/invitation', async (req: Request, res: Response) => {
    try {
        const { senderId, recipientId } = req.body;

        // Check if users exist
        const [sender, recipient] = await Promise.all([
            prisma.user.findUnique({ where: { id: senderId } }),
            prisma.user.findUnique({ where: { id: recipientId } })
        ]);

        if (!sender || !recipient) {
            return res.status(404).json({ error: 'One or both users not found' });
        }

        // Check if invitation already exists
        const existingInvitation = await prisma.friendInvitation.findUnique({
            where: {
                senderId_recipientId: {
                    senderId,
                    recipientId
                }
            }
        });

        if (existingInvitation) {
            return res.status(400).json({ error: 'Invitation already exists' });
        }

        // Create invitation
        const invitation = await prisma.friendInvitation.create({
            data: {
                senderId,
                recipientId,
                status: 'pending'
            }
        });

        res.status(201).json(invitation);
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// Accept or decline an invitation
router.put('/invitation/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "accepted" or "declined"' });
        }

        const invitation = await prisma.friendInvitation.update({
            where: { id },
            data: { status }
        });

        // If accepted, create friendship records
        if (status === 'accepted') {
            await prisma.$transaction([
                prisma.friend.create({
                    data: {
                        userId: invitation.senderId,
                        friendId: invitation.recipientId
                    }
                }),
                prisma.friend.create({
                    data: {
                        userId: invitation.recipientId,
                        friendId: invitation.senderId
                    }
                })
            ]);
        }

        res.json(invitation);
    } catch (error) {
        console.error('Error updating invitation:', error);
        res.status(500).json({ error: 'Failed to update invitation' });
    }
});

// Get pending invitations for a user
router.get('/invitation/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;

        const where: any = {};

        if (type === 'sent') {
            where.senderId = userId;
        } else if (type === 'received') {
            where.recipientId = userId;
            where.status = 'pending';
        } else {
            return res.status(400).json({ error: 'Type must be "sent" or "received"' });
        }

        const invitations = await prisma.friendInvitation.findMany({
            where,
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                recipient: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        res.json(invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

// Remove friendship
router.delete('/:userId/:friendId', async (req: Request, res: Response) => {
    try {
        const { userId, friendId } = req.params;

        // First check if the friendship exists
        const existingFriendship = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
        });

        if (!existingFriendship) {
            return res.status(404).json({ error: 'Friendship does not exist' });
        }

        // Proceed with deletion since friendship exists
        await prisma.$transaction([
            // Delete friendship records
            prisma.friend.deleteMany({
                where: {
                    OR: [
                        { userId, friendId },
                        { userId: friendId, friendId: userId }
                    ]
                }
            }),
            // Also delete invitation records
            prisma.friendInvitation.deleteMany({
                where: {
                    OR: [
                        { senderId: userId, recipientId: friendId },
                        { senderId: friendId, recipientId: userId }
                    ]
                }
            })
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

export default router;