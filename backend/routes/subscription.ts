import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Get popular subscriptions
router.get('/popular', async (_request: Request, response: Response) => {
  try {
    // Popular subscription IDs - these are real IDs from your seeded database
    const popularIds = [
      '682ad9c177e31b2fc863065a', // Netflix
      '682ad9c177e31b2fc8630668', // Spotify
      '682ad9c177e31b2fc86306ae', // Amazon Prime
      '682ad9c177e31b2fc8630669', // Apple Music
      '682ad9c177e31b2fc86306a9'  // GrubHub
    ];
    
    const popularSubscriptions = await prisma.subscription.findMany({
      where: { id: { in: popularIds } },
      orderBy: { name: 'asc' }
    });
    
    response.status(200).json(popularSubscriptions);
  } catch (error) {
    console.error('Error fetching popular subscriptions:', error);
    response.status(500).json({ message: 'Error fetching popular subscriptions' });
  }
});

// Search subscriptions
router.get('/', async (request: Request, response: Response) => {
  try {
    const { search } = request.query;
    
    let where = {};
    if (typeof search === 'string' && search.trim() !== '') {
      where = {
        name: {
          startsWith: search,
          mode: 'insensitive'
        }
      };
    }
    
    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 20
    });
    
    response.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    response.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

export default router;