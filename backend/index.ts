import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { router } from './routes/index';
import webhookRouter from './src/webhooks/clerk/route';
import { authMiddleware, authErrorHandler } from './src/middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(cors());

// Routes that don't require authentication (webhooks)
app.use('/webhooks', webhookRouter);

// API routes with authentication middleware
app.use('/api', authMiddleware, router);

// Error handling (must be after all routes)
app.use(authErrorHandler);

// Static files if needed
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});