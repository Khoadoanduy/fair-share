// import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';
import { User } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const router: Router = express.Router();
const expo = new Expo();

router.post('/register', async (req, res) => {
    const { clerkId, token } = req.body;

    if (!clerkId || !token) {
      return res.status(400).json({ error: 'clerkId and token are required' });
    }

    if (!Expo.isExpoPushToken(token)) {
        return res.status(400).json({ error: 'Invalid Expo push token' });
    }

    try {
        const user = await prisma.user.update({
        where: { clerkId: clerkId },
        data: { 
          pushToken: token,
        } 
        });
        res.json({ 
          success: true, 
          message: 'Push token registered successfully' 
        });
    }
    catch (error) {
        console.error('Error registering push token:', error);
        return res.status(500).json({ error: 'Failed to register push token' });
    }
});

  router.post('/send', async (req, res) => {
    const { clerkIds, clerkId, title, body, data } = req.body;

    // Support both single user (clerkId) and multiple users (clerkIds)
    const userIds = clerkIds || (clerkId ? [clerkId] : null);

    if (!userIds || userIds.length === 0 || !title || !body) {
        return res.status(400).json({ 
            error: 'clerkIds (or clerkId), title, and body are required' 
        });
    }

    try {
        // Fetch all users with their push tokens
        const users = await prisma.user.findMany({
            where: { 
                clerkId: { in: userIds }
            },
            select: { 
                clerkId: true,
                pushToken: true 
            }
        });

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'No users found with the provided IDs' 
            });
        }

        // Separate users with and without push tokens
        const usersWithTokens = users.filter(user => user.pushToken);
        const usersWithoutTokens = users.filter(user => !user.pushToken);

        if (usersWithTokens.length === 0) {
            return res.status(404).json({ 
                error: 'None of the specified users have push tokens',
                usersWithoutTokens: usersWithoutTokens.map(u => u.clerkId)
            });
        }

        // Create messages for all users with tokens
        const messages = usersWithTokens.map(user => ({
            to: user.pushToken!,
            sound: 'default',
            title,
            body,
            data: {
                ...data,
                userId: user.clerkId // Include userId in notification data
            },
        }));

        const tickets = [];
        const errors = [];

        // Send notifications in chunks
        for (const message of messages) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync([message]);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending notification chunk:', error);
                errors.push(error);
            }
        }

        // Process results
        const successfulTickets = tickets.filter(ticket => ticket.status === 'ok');
        const failedTickets = tickets.filter(ticket => ticket.status === 'error');

        res.json({
            success: true,
            message: 'Notifications processed',
            summary: {
                requested: userIds.length,
                usersFound: users.length,
                usersWithTokens: usersWithTokens.length,
                usersWithoutTokens: usersWithoutTokens.length,
                successful: successfulTickets.length,
                failed: failedTickets.length
            }
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ 
            error: 'Failed to send notifications',
            message: error
        });
    }
});


export default router;