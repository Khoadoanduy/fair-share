import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/user';
import webhookRouter from './src/webhooks/clerk/route';
import { authMiddleware, authErrorHandler } from './src/middleware';
import customerRoutes from './routes/stripe_customer';
import paymentRoutes from './routes/stripe_payment';
import userRoute from './routes/user'
import inviteRoute from './routes/invite'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(cors());

// Mount webhook router
app.use('/', webhookRouter);

app.use('/api/stripe', customerRoutes);
app.use('/api/stripe', paymentRoutes);
app.use('/api/user', userRoute)
app.use('/api/invite', inviteRoute)


// API routes with authentication middleware
app.use('/api/user', userRouter);

// Error handling (must be after all routes)
app.use(authErrorHandler);

// Static files if needed
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});