import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route'; // Adjust path if renamed to webhookRouter.ts
import groupRoutes from './routes/group';
import subscriptionRouter from './routes/subscription';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors());

app.use('/', webhookRouter);  
app.use('/api/groups', groupRoutes);
app.use('/api/subscriptions', subscriptionRouter);

app.listen(PORT, () => {
  console.log(`✅ Server is running locally at: http://localhost:${PORT}`);
});
