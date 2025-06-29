import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';


// Initialize environment variables
dotenv.config();

// Initialize Stripe with secret key
const stripe = require('stripe')(
        process.env.STRIPE_SECRET_KEY,
        {apiVersion: '2025-03-31.basil'}
      );

const router: Router = express.Router();

router.post('/webhook', async (request: Request, response: Response) => {
    const event = request.body;

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment Intent Succeeded:', paymentIntent);
            break;
        case 'issuing_authorization.request':
            response.writeHead(200, {"Stripe-Version": "2025-03-31.basil", "Content-Type": "application/json"});
            return response.end(JSON.stringify({ approved: true }));
        default:
            console.warn(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
});

export default router;