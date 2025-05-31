import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';
import { User } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const router: Router = express.Router();
const expo = new Expo();

router.post('/send', async (req, res) => {
    const { clerkId, title, body, data} = req.body;
  
    if (!clerkId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }
  
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId },
            select: { pushToken: true } 
        });
        if (!user) {
            return res.status(404).json({ 
              error: `User ${clerkId} not found` 
            });
        }
      
        if (!user.pushToken) {
            return res.status(404).json({ 
              error: `No push token found for user ${clerkId}` 
            });
        }

        const message = {
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data: {
              ...data
            },
        }

        await expo.sendPushNotificationsAsync([message]);


        res.json({
            success: true,
            message: 'Notification sent'
          });
  
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  export default router;