import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route'; // Adjust path if renamed to webhookRouter.ts
import customerRoutes from './routes/stripe_customer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount webhook router
app.use('/', webhookRouter);

app.use('/api/stripe', customerRoutes);

// app.post('/api/hello', async function(request,response) {
//   console.log("Hello World");
//   response.json()
// })

app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});

export interface CustomerRequest {
  email: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface CustomerWithPaymentMethodRequest extends CustomerRequest {
  paymentMethodId: string;
}