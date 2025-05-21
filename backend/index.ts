import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route'; // Adjust path if renamed to webhookRouter.ts
import customerRoutes from './routes/stripe_customer';
import paymentRoutes from './routes/stripe_payment';
import userRoute from './routes/user'

dotenv.config();

const app = express();
var cors = require('cors')
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());


// Mount webhook router
app.use('/', webhookRouter);

app.use('/api/stripe-customer', customerRoutes);
app.use('/api/stripe', paymentRoutes);
app.use('/api/user', userRoute)


app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});
