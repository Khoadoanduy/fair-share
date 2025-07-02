import express, { Request, Response, Router } from 'express';
import prisma from '../prisma/client';


// Initialize Stripe with secret key
const stripe = require('stripe')(
        process.env.STRIPE_SECRET_KEY,
        {apiVersion: '2025-03-31.basil'}
      );

const router: Router = express.Router();

router.post('/create', async function (request, response) {
    try {
        const { groupId, userId } = request.body;
        
        // Get user information 
        const user = await prisma.user.findUnique({
            where: {
                id: userId 
            }
        });

        if (!user) {
            return response.status(400).json({ error: 'User not found' });
        }

        console.log('User:', user);

        if (!user.dateOfBirth || !user.firstName || !user.lastName || !user.email || !user.phoneNumber) {
            return response.status(400).json({ error: 'User information is incomplete' });
        }

        if (!user.customerId) {
            return response.status(400).json({ error: 'User does not have a Stripe customer ID' });
        }

        // Get group information 
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return response.status(400).json({ error: 'Group not found' });
        }

        const ip = request.headers['x-forwarded-for'] || 
             request.socket.remoteAddress ||
             request.ip;

        // Get payment method for billing address
        const paymentMethods = await stripe.customers.listPaymentMethods(
            user.customerId
        );
        
        if (paymentMethods.data.length === 0) {
            return response.status(400).json({ error: 'No payment method found' });
        }

        const paymentMethod = paymentMethods.data[0];
        const address = paymentMethod.billing_details.address;

        // Create or get existing cardholder
        let cardholderId = user.cardholderId;
        
        if (!cardholderId) {
            // Create a new cardholder
            const cardholder = await stripe.issuing.cardholders.create({
                type: 'individual',
                name: user.firstName + ' ' + user.lastName,
                email: user.email,
                billing: {
                    address: {
                        line1: address.line1 || '',
                        city: address.city || '',
                        state: address.state || '',
                        postal_code: address.postal_code || '',
                        country: address?.country || 'US'
                    }
                },
                phone_number: user.phoneNumber,
                individual: {
                    card_issuing: {
                        user_terms_acceptance: {
                            date: Math.floor(Date.now() / 1000),
                            ip: ip,
                        },
                    },
                    dob: {
                        day: user.dateOfBirth.getDate(),
                        month: user.dateOfBirth.getMonth() + 1,
                        year: user.dateOfBirth.getFullYear()
                    },
                    first_name: user.firstName,
                    last_name: user.lastName
                }
            });
            
            cardholderId = cardholder.id;
            
            // Update user with cardholder ID
            await prisma.user.update({
                where: { id: user.id },
                data: { cardholderId: cardholderId }
            });
        }

        // Create the virtual card
        const card = await stripe.issuing.cards.create({
            cardholder: cardholderId,
            currency: 'usd',
            type: 'virtual',
            status: 'active',
            spending_controls: {
                spending_limits: [{
                    amount: Math.round(group.amount * 100), // Default $1000 in cents for individual cards
                    interval: 'all_time'
                }]
            },
        });

        await prisma.group.update({
            where: { id: groupId },
            data: { virtualCardId: card.id }
        });

        response.json({
            success: true,
            card: card,
            cardholder: cardholderId
        });

    } catch (err) {
        console.error('Error creating virtual card:', err);
        response.status(500).json({err});
    }
});

// Get virtual card details for a group
router.get('/:groupId', async function (request, response) {
    try {
        const { groupId } = request.params;

        if (!groupId) {
            return response.status(400).json({ 
                error: 'ID is required.' 
            });
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return response.status(400).json({ error: 'Group not found' });
        }
    
            if (!group.virtualCardId) {
                return response.status(404).json({ error: 'No virtual card found for this group' });
            }

        const virtualCardId = group.virtualCardId;

        // Retrieve the card details from Stripe
        const card = await stripe.issuing.cards.retrieve(virtualCardId, {
            expand: ['number', 'cvc'],
        });
        console.log(card)

        // Format the response
        const cardDetails = {
            id: card.id,
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            brand: card.brand,
            cardholderName: card.cardholder.name,
            status: card.status,
            type: card.type,
            currency: card.currency,
            number: card.number,
            cvc: card.cvc
        };

        response.json(cardDetails);
    } catch (err) {
        console.error('Error retrieving virtual card:', err);
        response.status(500).json({err});
    }
});
    
export default router;