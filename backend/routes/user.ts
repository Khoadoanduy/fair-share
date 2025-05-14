import express, { Request, Response, Router, response } from 'express';
import { User } from '@prisma/client';
import prisma from '../prisma/client';
import { stat } from 'fs';



const router: Router = express.Router();

router.get('/', async function (request,response){
    const clerkID = request.query.clerkID as string;
    const user = await prisma.user.findUnique({
        where:{
            clerkId: clerkID
        },
    })
    if(!user){response.status(401).send("User not found")}
    else response.json(user)
})

router.put('/:clerkID', async function(request,response){
    const clerkID = request.params.clerkID as string;
    const customerID = request.body.name as string;
    const updated = await prisma.user.update({
        where: { clerkId: clerkID },
        data: { customerId:customerID },
    });
    response.json(updated);
})


export default router;