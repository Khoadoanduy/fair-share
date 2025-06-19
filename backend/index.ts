import express from 'express';
// import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route';
import { authMiddleware, authErrorHandler } from './src/middleware';
import paymentRoutes from './routes/stripe_payment';
import customerRoutes from './routes/stripe_customer'
import userRoute from './routes/user'
import inviteRoute from './routes/invite'
import friendRoute from './routes/friend';
import feedRouter from './routes/feed';
import groupRoute from './routes/group';
import subscriptionRouter from './routes/subscription';
import groupMemberRoute from './routes/groupMember'
import virtualCardRoute from './routes/virtualCard';
import notificationsRoute from './routes/notifications';
import confirmShare from './routes/confirmShare';
import cors from 'cors';  // Add this

// dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());



// Mount webhook router
app.use(cors());
app.use('/', webhookRouter);

app.use('/api/stripe-customer', customerRoutes);
app.use('/api/stripe-payment', paymentRoutes);
app.use('/api/user', userRoute)
app.use('/api/invite', inviteRoute)
app.use('/api/friend', friendRoute)
app.use('/api/feed', feedRouter);
app.use('/api/group', groupRoute);
app.use('/api/groupMember', groupMemberRoute);
app.use('/api/virtualCard', virtualCardRoute);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/cfshare', confirmShare);
app.use('/api/notifications', notificationsRoute);


// Error handling (must be after all routes)
app.use(authErrorHandler);

// Static files if needed
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
  console.log(`✅ Server is running locally at: http://localhost:${PORT}`);
});