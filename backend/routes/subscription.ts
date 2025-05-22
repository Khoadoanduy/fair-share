import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

// To get popular subscriptions
router.get('/popular', async (_request: Request, response: Response) => {
  try {
    // Popular subscription IDs - update these with actual IDs from your database
    const popularIds = ['682ad9c177e31b2fc863065a', // Netflix
                        '682ad9c177e31b2fc8630668', // Spotify
                        '682ad9c177e31b2fc86306ae', // Amazon Prime
                        '682ad9c177e31b2fc8630669', // Apple Music
                        '682ad9c177e31b2fc86306a9', // GrubHub
                       ];
    
    const popularSubscriptions = await prisma.subscription.findMany({
      where: {
        id: { in: popularIds }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return response.status(200).json(popularSubscriptions);
  } catch (error) {
    console.error('Error fetching popular subscriptions:', error);
    response.status(500).json({ message: 'Error fetching popular subscriptions' });
  }
});

router.get('/', async (request: Request, response: Response) => {
  try {
    const { search, popular } = request.query;
    
    // If requesting popular subscriptions
    if (popular === 'true') {
      // Popular subscription IDs (replace with actual IDs)
      const popularIds = ['spotify-id', 'netflix-id', 'youtube-id', 'amazon-id', 'apple-music-id'];
      
      const popularSubscriptions = await prisma.subscription.findMany({
        where: {
          id: { in: popularIds }
        },
        // Maintain the order specified in popularIds
        orderBy: {
          name: 'asc'
        }
      });
      
      return response.status(200).json(popularSubscriptions);
    }
    
    // Regular search logic
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