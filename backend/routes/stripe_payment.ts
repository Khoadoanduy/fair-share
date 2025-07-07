import { group } from 'console';
import express, { Request, Response, Router } from 'express';

// Initialize Stripe with secret key
const stripe = require('stripe')(
        process.env.STRIPE_SECRET_KEY,
        {apiVersion: '2025-03-31.basil'}
      );

const router: Router = express.Router();

router.post('/charge-user', async function (request, response) {
  try {
        const customerStripeID = request.body.customerStripeID;
        const groupId = request.body.groupId;
        const validIntervals = {'daily':'day','weekly':'week','monthly':'month','yearly':'year'};
        const cycle = validIntervals[request.body.cycle as keyof typeof validIntervals];
        const intervalCount = request.body.intervalCount
        if (!customerStripeID) {
          return response.status(400).json({ error: 'Customer Stripe ID is required' });
        }
        if (!request.body.amountEach) {
          return response.status(400).json({ error: 'Amount is required' });
        }
        
        const preAmount = request.body.amountEach * 100; //in cents
        // Calculate Stripe fees: 2.9% + 30¢
        const stripeFeePercentage = 0.029; // 2.9%
      const stripeFixedFee = 0.3; // 30 cents
      const amount = Math.round((preAmount + stripeFixedFee) / (1 - stripeFeePercentage));
      const paymentMethods = await stripe.customers.listPaymentMethods(customerStripeID);
      const paymentMethod = paymentMethods.data[0];

      // Create a product
      const product = await stripe.products.create({
          name: `Group Charge for ${groupId}`,
      });

      // Create a price for the product
      const price = await stripe.prices.create({
          unit_amount: amount,
          currency: 'usd',
          recurring: { interval: cycle, interval_count: intervalCount},
          product: product.id
      });

      // Create a subscription
      const subscription = await stripe.subscriptions.create({
          customer: customerStripeID,
          items: [{ price: price.id }],
          default_payment_method: paymentMethod.id,
          metadata: {
            groupId: groupId
          }
      });

      response.json({
          subscription: subscription.id
        });
      } catch (err) {
        // Log for debugging
        console.error('Error creating Stripe subscription:', err);

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

      const transactions = await stripe.subscriptions.list({
          limit: 100,
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