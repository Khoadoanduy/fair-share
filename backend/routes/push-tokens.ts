import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';
import { User } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const router: Router = express.Router();

// Register/Update push token
router.post('/register', async (req, res) => {
    const { userId, token } = req.body;
  
    if (!userId || !token) {
      return res.status(400).json({ error: 'userId and token are required' });
    }
  
    if (!Expo.isExpoPushToken(token)) {
        return res.status(400).json({ error: 'Invalid Expo push token' });
    }
  
    try {
        const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          pushToken: token,
          tokenUpdatedAt: new Date(),
        } as any, // Add 'as any' to bypass type checking
        });
    }
    catch (error) {
        console.error('Error registering push token:', error);
        return res.status(500).json({ error: 'Failed to register push token' });
    }
});
