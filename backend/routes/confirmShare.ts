import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { group } from 'console';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

//Create share confirmation request for everyone
router.post('/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId is required' });
        }
        //Find the member of the group
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId: groupId},
            select: {
                userId: true,
                userRole: true
            }
        });

        if (groupMembers.length === 0) {
            return response.status(404).json({ message: 'No members found in group' });
        }
        //
        const newConfirm = await Promise.all(
            groupMembers.map(member => prisma.confirmShare.create({
                data: {
                    userId: member.userId,
                    groupId: groupId,
                    status: member.userRole === "leader"
                }
            }))
        );   
        response.status(200).json({ message: 'Confirm shares created ' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error creating confirm shares' });
    }
});

//Check if user has accepted the confirm request 
router.get('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Find the member of the group
        const confirmReq = await prisma.confirmShare.findFirst({
            where: { 
                groupId: groupId,
                userId: userId
            },
        });

        if (!confirmReq) {
            return response.status(200).json({ message: 'Confirm request has not been sent' });
        }
        response.status(200).json(confirmReq.status);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error creating confirm shares' });
    }
});

//Check if the leader has sent the confirm request
router.get('/:groupId', async (request: Request, response: Response) => {
    try {
        const { groupId } = request.params;
        if (!groupId) {
            return response.status(400).json({ message: 'groupId is required' });
        }
        //Find the member of the group
        const confirmReq = await prisma.confirmShare.findFirst({
            where: { 
                groupId: groupId,
            },
        });

        if (!confirmReq) {
            return response.status(200).json(false);
        }
        response.status(200).json(true);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error checking confirm shares request' });
    }
});

//Update the confirm share (from false to true => when confirm)
router.put('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Find confirm request
        const cfRequest = await prisma.confirmShare.findFirst({
            where: { 
                groupId: groupId, 
                userId: userId
            },
        });

        if (!cfRequest) {
            return response.status(404).json({ message: 'Confirm request not found' });
        }
        //
        await prisma.confirmShare.update({
            where: { id: cfRequest.id },
            data: { status: true}
        })
        response.status(200).json({ message: 'Confirm shares updated ' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error updating confirm shares' });
    }
});

export default router