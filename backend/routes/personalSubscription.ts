import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Create personal subscription
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      subscriptionName,
      planName,
      amount,
      cycle,
      cycleDays,
      category,
      logo,
      subscriptionType, // Optional field for subscription type
    } = req.body;

    if (!userId || !subscriptionName || !planName || !amount || !cycle || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const personalSubscription = await prisma.personalSubscription.create({
      data: {
        userId,
        subscriptionName,
        planName,
        amount: parseFloat(amount),
        cycle,
        cycleDays: parseInt(cycleDays),
        category,
        logo: logo || null,
        subscriptionType: subscriptionType || 'existing', // Defult to 'existing' if not provided
      },
    });

    res.status(201).json({
      subscriptionId: personalSubscription.id,
      message: 'Personal subscription created successfully',
      data: personalSubscription
    });
  } catch (error) {
    console.error('Error creating personal subscription:', error);
    res.status(500).json({ message: 'Failed to create personal subscription' });
  }
});

// Get personal subscriptions for user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const personalSubscriptions = await prisma.personalSubscription.findMany({
      where: { userId },
      include: { subscription: true },
    });
    res.json(personalSubscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch personal subscriptions' });
  }
});

// Get single personal subscription
router.get('/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const personalSubscription = await prisma.personalSubscription.findUnique({
      where: { id: subscriptionId },
      include: { subscription: true },
    });

    if (!personalSubscription) {
      return res.status(404).json({ message: 'Personal subscription not found' });
    }

    res.json(personalSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch personal subscription' });
  }
});

// Update credentials
router.put('/:subscriptionId/credentials', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { username, password } = req.body;

    await prisma.personalSubscription.update({
      where: { id: subscriptionId },
      data: {
        credentialUsername: username,
        credentialPassword: password,
      },
    });

    res.json({ message: 'Credentials updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credentials' });
  }
});

export default router;