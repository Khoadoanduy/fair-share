import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

export default router