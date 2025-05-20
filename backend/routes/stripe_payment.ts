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

router.post('/payment-sheet', async function (request, response) {
    try {
        const customerInfo = request.body.customerInfo;
        const customer = await stripe.customers.create({
            email: customerInfo
        });
        const ephemeralKey = await stripe.ephemeralKeys.create(
            {customer: customer.id},
            {apiVersion: '2025-03-31.basil'}
        );
        const setupIntent = await stripe.setupIntents.create(
            {customer: customer.id,
            payment_method_types: ['card']},
            {apiVersion: '2025-03-31.basil'}
        );
        response.json({
            setupIntent: setupIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id
          });
        } catch (err) {
          // Log for debugging
          console.error('Error creating Stripe paymentSheet:', err);
      
          // Send back the Stripe (or other) error message
          response.status(500).json({err});
        }
    });

router.post('/charge-user', async function (request, response) {
    try {
        const customerStripeID = request.body.customerStripeID ;
        const amount = request.body.amount;
        const paymentMethods = await stripe.customers.listPaymentMethods(customerStripeID);
        const paymentMethod = paymentMethods.data[0];

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
              enabled: true,
            },
            customer: customerStripeID,
            payment_method: paymentMethod.id,
            off_session: true,
            confirm: true,
          });
        
        response.json({
            paymentIntent: paymentIntent.id
          });
        } catch (err) {
          // Log for debugging
          console.error('Error creating Stripe paymentIntent:', err);
      
          // Send back the Stripe (or other) error message
          response.status(500).json({err});
        }
    });
    
export default router;