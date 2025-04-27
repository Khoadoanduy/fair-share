import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route'; // Adjust path if renamed to webhookRouter.ts

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount webhook router
app.use('/', webhookRouter);

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
