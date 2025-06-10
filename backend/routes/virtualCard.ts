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

        // Update user with cardholder ID
        await prisma.user.update({
            where: { id: customer.id },
            data: { cardholderId: cardholder.id }
        });

        response.json({
            card: card.id,
            cardholder: cardholder.id
          });
        } catch (err) {
          // Log for debugging
          console.error('Error creating Stripe virtual card:', err);
      
          // Send back the Stripe (or other) error message
          response.status(500).json({err});
        }
    });

// Create a virtual card for a group using leader info
router.post('/create-for-group', async function (request, response) {
    try {
        console.log("Creating virtual card for group");
        const { groupId, leaderId } = request.body;

        if (!groupId || !leaderId) {
            return response.status(400).json({ error: 'Group ID and leader ID are required' });
        }

        // Get the leader's information
        const leader = await prisma.user.findUnique({
            where: { id: leaderId }
        });

        if (!leader) {
            return response.status(400).json({ error: 'Leader not found' });
        }

        if (!leader.customerId) {
            return response.status(400).json({ error: 'Leader does not have a Stripe customer ID' });
        }

        if (!leader.dateOfBirth || !leader.firstName || !leader.lastName || !leader.email || !leader.phoneNumber) {
            return response.status(400).json({ error: 'Leader information is incomplete' });
        }

        // Get the group information
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return response.status(400).json({ error: 'Group not found' });
        }

        const ip = request.headers['x-forwarded-for'] || 
             request.socket.remoteAddress ||
             request.ip;

        // Get leader's payment method for billing address
        const paymentMethods = await stripe.customers.listPaymentMethods(leader.customerId);
        if (paymentMethods.data.length === 0) {
            return response.status(400).json({ error: 'Leader does not have a payment method' });
        }
        
        const paymentMethod = paymentMethods.data[0];
        const address = paymentMethod.billing_details.address;

        // Create or get existing cardholder
        let cardholderId = leader.cardholderId;
        
        if (!cardholderId) {
            // Create a new cardholder
            const cardholder = await stripe.issuing.cardholders.create({
                type: 'individual',
                name: leader.firstName + ' ' + leader.lastName,
                email: leader.email,
                billing: {
                    address: {
                        line1: address.line1 || '',
                        city: address.city || '',
                        state: address.state || '',
                        postal_code: address.postal_code || '',
                        country: address?.country || 'US' // Default to US if not provided
                    }
                },
                phone_number: leader.phoneNumber,
                individual: {
                    card_issuing: {
                        user_terms_acceptance: {
                            date: Math.floor(Date.now() / 1000), // Current timestamp in seconds
                            ip: ip, // Client IP address where terms were accepted
                        },
                    },
                    dob: {
                        day: leader.dateOfBirth.getDate(),
                        month: leader.dateOfBirth.getMonth() + 1, // Months are 0-indexed in JavaScript
                        year: leader.dateOfBirth.getFullYear()
                    },
                    first_name: leader.firstName,
                    last_name: leader.lastName
                }
            });
            
            cardholderId = cardholder.id;
            
            // Update user with cardholder ID
            await prisma.user.update({
                where: { id: leader.id },
                data: { cardholderId: cardholderId }
            });
        }

        // Create a virtual card for the group
        const card = await stripe.issuing.cards.create({
            cardholder: cardholderId,
            currency: 'usd',
            type: 'virtual',
            status: 'active',
            spending_controls: {
                spending_limits: [{
                    amount: Math.round(group.amount * 100), // Convert dollars to cents
                    interval: 'all_time'
                }]
            },
        });

        // Update the group with the virtual card ID
        await prisma.group.update({
            where: { id: groupId },
            data: { virtualCardId: card.id }
        });

        response.json({
            success: true,
            card: card.id,
            cardholder: cardholderId
        });
    } catch (err) {
        // Log for debugging
        console.error('Error creating group virtual card:', err);
    
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

// Get virtual card details for a group
router.get('/group/:groupId', async function (request, response) {
    try {
        const { groupId } = request.params;

        if (!groupId) {
            return response.status(400).json({ error: 'Group ID is required' });
        }

        // Get the group with its virtual card ID
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return response.status(400).json({ error: 'Group not found' });
        }

        if (!group.virtualCardId) {
            return response.status(404).json({ error: 'No virtual card found for this group' });
        }

        // Retrieve the card details from Stripe
        const card = await stripe.issuing.cards.retrieve(group.virtualCardId, {
            expand: ['number', 'cvc'],
        });
        console.log(card)
        // Get cardholder details - Use the cardholder ID string
        const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder.id || card.cardholder);

        // Format the response
        const cardDetails = {
            id: card.id,
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            brand: card.brand,
            cardholderName: cardholder.name,
            status: card.status,
            type: card.type,
            currency: card.currency
        };

        response.json(cardDetails);
    } catch (err) {
        console.error('Error retrieving group virtual card:', err);
        response.status(500).json({err});
    }
});
    
export default router;