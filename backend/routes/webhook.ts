import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import { SubscriptionVerifier } from '../utils/verifier';
import prisma from '../prisma/client';

const subscriptionVerifier = new SubscriptionVerifier(process.env.OPENAI_KEY!);

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
            const authorization = event.data.object;
            const merchantData = {
                category: authorization.merchant_data.category,
                category_code: authorization.merchant_data.category_code,
                city: authorization.merchant_data.city,
                country: authorization.merchant_data.country,
                name: authorization.merchant_data.name,
                network_id: authorization.merchant_data.network_id,
                postal_code: authorization.merchant_data.postal_code,
                state: authorization.merchant_data.state,
            };

            const expectedSubscription = await prisma.group.findUnique({
                where: {
                    virtualCardId: authorization.card.id,
                },
                select: {
                    subscriptionName: true,
                },
            });

            console.log('Expected Subscription:', expectedSubscription?.subscriptionName);


            // Verification
            const result = await subscriptionVerifier.verifyWithGPT(
                merchantData, 
                expectedSubscription?.subscriptionName || ''
            );
            
            const approved = result.status === 'MATCH' && result.confidence >= 70;
            
            response.writeHead(200, {
                "Stripe-Version": "2025-03-31.basil", 
                "Content-Type": "application/json"
            });
            return response.end(JSON.stringify({ approved }));
        default:
            console.warn(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
});

export default router;