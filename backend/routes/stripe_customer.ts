// Required packages:
// npm install express cors body-parser stripe dotenv
// npm install --save-dev @types/express @types/cors @types/body-parser typescript ts-node

import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import prisma from '../prisma/client';
// import axios from "axios";
// const API_URL = 'http://localhost:3000';

// Initialize environment variables
dotenv.config();

// Initialize Stripe with secret key
const stripe = require('stripe')(
        process.env.STRIPE_SECRET_KEY,
        {apiVersion: '2025-03-31.basil'}
      );

const router: Router = express.Router();

router.post('/create-customer', async function (request, response) {
  try {
    const { email, name, phone } = request.body;


    const customerData = { email, name, phone };

    const stripeCustomer = await stripe.customers.create(customerData);

    return response.status(200).json({ customer: stripeCustomer });
  } catch (err) {
    // Log for your own debugging
    console.error('Error creating Stripe customer:', err);

    // Send back the Stripe (or other) error message
    response.status(500).json({err});
  }
});

// 3. Get customer by ID
router.get('/customers/:customerId', async (req: Request<{ customerId: string }>, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return res.status(404).json({ error: 'Customer has been deleted' });
    }
    res.json({ customer });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// 4. List all customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const email = req.query.email as string | undefined;
    const params: Stripe.CustomerListParams = {limit}
    if (email) params.email = email;
    const customers = await stripe.customers.list(params);
    
    res.json(customers);
  } catch (error) {
    console.error('Error listing customers:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// 5. Update customer
router.put('/customers/:customerId', async (req: Request<{ customerId: string }, {}, Partial<CreateCustomerRequest>>, res: Response) => {
  try {
    const { customerId } = req.params;
    const { email, name, phone, description, metadata } = req.body;

    // Only include fields that are provided
    const updateParams: Stripe.CustomerUpdateParams = {};

    if (email !== undefined) updateParams.email = email;
    if (name !== undefined) updateParams.name = name;
    if (phone !== undefined) updateParams.phone = phone;
    if (description !== undefined) updateParams.description = description;
    if (metadata !== undefined) updateParams.metadata = metadata as Stripe.MetadataParam; // cast type to Stripe.MetadataParam

    const customer = await stripe.customers.update(customerId, updateParams);

    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// 6. Delete customer
router.delete('/customers/:customerId', async (req: Request<{ customerId: string }>, res: Response) => {
  try {
    const { customerId } = req.params;
    
    const deleted = await stripe.customers.del(customerId);
    
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// 7. Search customers
router.get('/search-customers', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string | undefined;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const customers = await stripe.customers.search({
      query,
    });
    
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// 8. Check if a user has a payment method
router.get('/check', async (req: Request, res: Response) => {
  try {
    const clerkID = req.query.clerkID as string;
    
    if (!clerkID) {
      return res.status(400).json({ error: 'clerkID is required' });
    }
    
    // First, find the user in our database to get their Stripe customer ID
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkID
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If the user doesn't have a Stripe customer ID, they don't have a payment method
    if (!user.customerId) {
      return res.json({ hasPaymentMethod: false });
    }
    
    // Retrieve the customer's payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.customerId,
      type: 'card'
    });
    
    // Check if the customer has at least one payment method
    const hasPaymentMethod = paymentMethods.data.length > 0;
    
    res.json({ hasPaymentMethod });
  } catch (error) {
    console.error('Error checking payment method:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export default router;