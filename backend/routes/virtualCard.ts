import dotenv from 'dotenv';
import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';

// Initialize environment variables
dotenv.config();

// Initialize Stripe with secret key
const stripe = require('stripe')(
        process.env.STRIPE_SECRET_KEY,
        {apiVersion: '2025-03-31.basil'}
      );

const router: Router = express.Router();

router.post('/create', async function (request, response) {
    try {
        const customerId = request.query.stripeId as string;

        const customer = await prisma.user.findUnique({
            where: {
                customerId: customerId,
            }
        });

        if (!customer) {
            return response.status(400).json({ error: 'Customer not found' });
        }

        if (!customer.dateOfBirth || !customer.firstName || !customer.lastName || !customer.email || !customer.phoneNumber) {
            return response.status(400).json({ error: 'Customer information is incomplete' });
        }

        const ip = request.headers['x-forwarded-for'] || 
             request.socket.remoteAddress ||
             request.ip;

        const paymentMethods = await stripe.customers.listPaymentMethods(customerId);
        const paymentMethod = paymentMethods.data[0];

        const address = paymentMethod.billing_details.address

        const cardholder = await stripe.issuing.cardholders.create({
            type: 'individual',
            name: customer.firstName + ' ' + customer.lastName,
            email: customer.email,
            billing: {
                address: {
                    line1: address.line1 || '',
                    city: address.city || '',
                    state: address.state || '',
                    postal_code: address.postal_code || '',
                    country: address?.country || 'US' // Default to US if not provided
                }
            },
            phone_number: customer.phoneNumber,
            individual: {
                card_issuing: {
                    user_terms_acceptance: {
                        date: Math.floor(Date.now() / 1000), // Current timestamp in seconds
                        ip: ip, // Client IP address where terms were accepted
                    },
                },
                dob: {
                    day: customer.dateOfBirth.getDate(),
                    month: customer.dateOfBirth.getMonth() + 1, // Months are 0-indexed in JavaScript
                    year: customer.dateOfBirth.getFullYear()
                },
                first_name: customer.firstName,
                last_name: customer.lastName
            }
        });

        const card = await stripe.issuing.cards.create({
            cardholder: cardholder.id,
            currency: 'usd',
            type: 'virtual',
            status: 'active',
            spending_controls: {
                spending_limits: [{
                    amount: 100000, // $1000 in cents
                    interval: 'all_time'
                }]
            },
        });

        response.json({
            card: card.id
          });
        } catch (err) {
          // Log for debugging
          console.error('Error creating Stripe virtual card:', err);
      
          // Send back the Stripe (or other) error message
          response.status(500).json({err});
        }
    });

    router.get('/get', async function (request, response) {
        try {
            const customerId = request.query.stripeId as string;

            const customer = await prisma.user.findUnique({
                where: {
                    customerId: customerId,
                }
            });

            if (!customer) {
                return response.status(400).json({ error: 'Customer not found' });
            }

            const cardholder = customer.cardholderId;

            if (!cardholder) {
                return response.status(400).json({ error: 'Hasnt created virtual card for this user' });
            }

            const cards = await stripe.issuing.cards.list({
                cardholder: cardholder,
            });

            response.json({
                cards: cards.data
              });
            } catch (err) {
              // Log for debugging
              console.error('Error listing virtual cards list:', err);

              // Send back the Stripe (or other) error message
              response.status(500).json({err});
            }
        });

    
export default router;