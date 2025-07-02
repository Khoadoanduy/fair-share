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

router.post('/charge-user', async function (request, response) {
  try {
      const customerStripeID = request.body.customerStripeID;
      if (!customerStripeID) {
          return response.status(400).json({ error: 'Customer Stripe ID is required' });
      }
      if (!request.body.amount) {
          return response.status(400).json({ error: 'Amount is required' });
      }
      const preAmount = request.body.amount; //in cents
        // Calculate Stripe fees: 2.9% + 30¢
      const stripeFeePercentage = 0.029; // 2.9%
      const stripeFixedFee = 30; // 30 cents
      const amount = Math.round((preAmount + stripeFixedFee) / (1 - stripeFeePercentage));
      const paymentMethods = await stripe.customers.listPaymentMethods(customerStripeID);
      const paymentMethod = paymentMethods.data[0];
      const subscription = request.body.subscription;

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
          description: subscription
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

router.get('/transactions', async function (request, response) {
  try {
      const customerStripeID = request.query.customerStripeID;
      if (!customerStripeID) {
          return response.status(400).json({ error: 'Customer Stripe ID is required' });
      }

      const transactions = await stripe.paymentIntents.list({
          limit: 20,
          customer: customerStripeID,
      });

      response.json(transactions.data);
  } catch (err) {
      // Log for debugging
      console.error('Error fetching Stripe transactions:', err);

      // Send back the Stripe (or other) error message
      response.status(500).json({ err });
  }
});
    
export default router;