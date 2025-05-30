import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

// Add user to a group
router.post('/:groupId/:userId', async function (request, response) {
    try {
        const { groupId, userId } = request.params;
        const { userRole } = request.body;
        //Check if member is already in that group
        const existedMember = await prisma.groupMember.findFirst({
            where: { userId, groupId }
        });
        if (existedMember) {
            return response.status(400).json({ message: 'Users already in group' })
        }
        const newMember = await prisma.groupMember.create({
            data: { userId, groupId, userRole }
            });
        response.status(201).json({ message: 'Member added', newMember});
    } catch (error) {
        console.error("Error adding member to group:", error);
        response.status(500).send("Internal server error");
    }
});

// Delete user from a group
router.delete('/:groupId/:userId', async function (request, response) {
    try {
        const { groupId, userId } = request.params;
        const deleteMember = await prisma.groupMember.findFirst({
            where: { userId, groupId }
            });
        if (!deleteMember) {
            return response.status(400).json({ message: 'Member not in group' });
        }
        await prisma.groupMember.delete({
            where: { id: deleteMember.id}
        });
        response.status(201).json({ message: 'Member deleted', deleteMember});
    } catch (error) {
        console.error("Error deleting member from group:", error);
        response.status(500).send("Internal server error");
    }
});

// Get all members of a group
router.get('/:groupId/', async function (request, response) {
    try {
        const { groupId } = request.params;
        const allMember = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: true
            }
        });
        response.status(201).json(allMember);
    } catch (error) {
        console.error("Error adding member to group:", error);
        response.status(500).send("Internal server error");
    }
});

// Check if a user is in a group
router.get('/:groupId/:userId', async function (request, response) {
    try {
        const { groupId, userId } = request.params;
        const member = await prisma.groupMember.findFirst({
            where: { groupId, userId }
        });
        if (member) {
            return response.status(200).json(true);
        }
        return response.status(200).json(false);
    } catch (error) {
        console.error("Error finding member in the group", error);
        response.status(500).send("Internal server error");
    }
})
export default router