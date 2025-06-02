
import express, { Request, Response, Router, response } from 'express';
import { User } from '@prisma/client';
import prisma from '../prisma/client';



const router: Router = express.Router();


router.get('/', async function (request, response) {
    try {
        const clerkID = request.query.clerkID as string;
        const user = await prisma.user.findUnique({
            where: {
                clerkId: clerkID,
            },
        });
        console.log(user)
        if (!user) {
            return response.status(430).send("User not found");
        }
        response.json(user);
    } catch (error) {
        console.error("Error retrieving user:", error);
        response.status(500).send("Internal Server Error");
    }
});

router.put('/:clerkID', async function(request, response) {
    const clerkID = request.params.clerkID as string;
    const { phoneNumber, dateOfBirth, customerId } = request.body;

    try {
        const updated = await prisma.user.update({
            where: { clerkId: clerkID },
            data: { 
                phoneNumber: phoneNumber || undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                customerId: customerId || undefined,
            },
        });
        response.json(updated);
    } catch (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Failed to update user' });
    }
});
router.put('/:clerkID/:customerId', async function(request, response) {
    const clerkID = request.params.clerkID as string;
    const cusomter = request.params.customerId as string;
    console.log(cusomter)

    try {
        const updated = await prisma.user.update({
            where: { clerkId: clerkID },
            data: { 
                customerId: cusomter ? cusomter : undefined, // Set cusomterId only if it's provided in the request body
            },
        });
        response.json(updated);
    } catch (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Failed to update user' });
    }
});


export default router;