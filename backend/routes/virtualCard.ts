// import dotenv from 'dotenv';
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
        
        // Determine if this is a group card creation or individual card creation
        const isGroupCard = groupId && userId;
        
        // Get user information (either customer or leader)
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

        if (isGroupCard && !user.customerId) {
            return response.status(400).json({ error: 'Leader does not have a Stripe customer ID' });
        }

        // Get group information if it's a group card
        let group;
        let personalSub;
        if (isGroupCard) {
            group = await prisma.group.findUnique({
                where: { id: groupId }
            });

            if (!group) {
                return response.status(400).json({ error: 'Group not found' });
            }
        } else {
            // For individual card, ensure the user has a customer ID
            if (!user.customerId) {
                return response.status(400).json({ error: 'User does not have a Stripe customer ID' });
            }

            // Get personal subscription details
            personalSub = await prisma.personalSubscription.findFirst({
                where: {
                    userId: user.id,
                }
            });

            if (!personalSub) {
                return response.status(400).json({ error: 'User does not have an active subscription' });
            }
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
                    amount: isGroupCard && group ? Math.round(group.amount * 100) : Math.round((personalSub?.amount || 0) * 100), // Default $1000 in cents for individual cards
                    interval: 'all_time'
                }]
            },
        });

        // If it's a group card, update the group with the virtual card ID
        if (isGroupCard) {
            await prisma.group.update({
                where: { id: groupId },
                data: { virtualCardId: card.id }
            });
        } else if (personalSub) {
            // For individual cards, update the user's personal subscription with the virtual card ID
            await prisma.personalSubscription.update({
                where: { id: personalSub.id },
                data: { virtualCardId: card.id }
            });
        }

        response.json({
            success: true,
            card: card.id,
            cardholder: cardholderId
        });

    } catch (err) {
        console.error('Error creating virtual card:', err);
        response.status(500).json({err});
    }
});

// Get virtual card details for a group
router.get('/:type/:id', async function (request, response) {
    try {
        const { type, id } = request.params;

        if (!type || !id) {
            return response.status(400).json({ 
                error: 'Type and ID are required. Use /group/{groupId} or /personal/{userId}' 
            });
        }

        if (!['group', 'personal'].includes(type)) {
            return response.status(400).json({ 
                error: 'Type must be either "group" or "personal"' 
            });
        }

        const groupId = type === 'group' ? id : null;
        const personaId = type === 'personal' ? id : null;
        let group = null;
        let personalSub = null;
        if (groupId) {
            group = await prisma.group.findUnique({
                where: { id: groupId }
            });

            if (!group) {
                return response.status(400).json({ error: 'Group not found' });
            }
    
            if (!group.virtualCardId) {
                return response.status(404).json({ error: 'No virtual card found for this group' });
            }
        } else {
            if (personaId) {
                personalSub = await prisma.personalSubscription.findFirst({
                    where: { id: personaId }
                });
            } else {
                return response.status(400).json({ error: 'Personal subscription ID is required' });
            }
        }

        let virtualCardId = type === 'group' && group ? group.virtualCardId : personalSub ? personalSub.virtualCardId : null;

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