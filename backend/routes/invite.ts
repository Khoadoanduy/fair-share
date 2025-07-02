import express, { Request, Response, Router } from 'express';
// import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// dotenv.config();

const router: Router = express.Router();
const prisma = new PrismaClient();

//Create invitation to group
router.post('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Check if the user has already been invited to this group
        const existingInvitation = await prisma.groupInvitation.findFirst({
          where: { 
            groupId, 
            userId, 
            status: { in: ['pending', 'accepted']} 
          },
        })
        if (existingInvitation) {
          return response.status(409).json({ message: 'User already invited' });
        }
        const invitation = await prisma.groupInvitation.create({
          data: {
            groupId,
            userId,
            status: 'pending',
            type: 'invitation' // Leader invites user
          }
        })
        response.status(200).json({ message: 'Successful invitation' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error sending invitation' });
    }
});

//Delete invitation (when user rejects the invitation)
router.delete('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Check if the user has already been invited to this group
        const deleteInvitation = await prisma.groupInvitation.findFirst({
          where: { groupId, userId, }
        })
        if (!deleteInvitation) {
          return response.status(409).json({ message: 'User has not been invited' });
        }
        await prisma.groupInvitation.delete({
          where: { id: deleteInvitation.id }
        })
        response.status(200).json({ message: 'Invitation deleted' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error deleting invitation' });
    }
});

//Update invitation status from pending to accepted (if rejected => delete invitation)
router.put('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId, userId, and status are required' });
        }
        //Check if the user has already been invited to this group
        const updateInvitation = await prisma.groupInvitation.findFirst({
          where: { groupId, userId, }
        })
        if (!updateInvitation) {
          return response.status(409).json({ message: 'User has not been invited' });
        }
        if (updateInvitation.status != "pending") {
          return response.status(409).json({ message: 'Already updated invitation to accept or reject'})
        }
        await prisma.groupInvitation.update({
          where: { id: updateInvitation.id },
          data: { status: "accepted" }
        })
        response.status(200).json({ message: 'Invitation updated' });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error updating invitation' });
    }
});

//Get invitation information
router.get('/:groupId/:userId', async (request: Request, response: Response) => {
    try {
        const { groupId, userId } = request.params;
        if (!groupId || !userId) {
            return response.status(400).json({ message: 'groupId and userId are required' });
        }
        //Check if the user has already been invited to this group
        const invitation = await prisma.groupInvitation.findFirst({
          where: { groupId, userId }
        })
        if (!invitation) {
          return response.status(409).json({ message: 'User has not been invited' });
        }
        response.status(200).json(invitation);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error getting invitation' });
    }
});

// User requests to join a group (different from being invited)
router.post('/request/:groupId/:userId', async (request: Request, response: Response) => {
  try {
    const { groupId, userId } = request.params;
    if (!groupId || !userId) {
      return response.status(400).json({ message: 'groupId and userId are required' });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, userId }
    });
    if (existingMember) {
      return response.status(409).json({ message: 'User is already a member of this group' });
    }

    // Check if there's already a pending request or invitation
    const existingRequest = await prisma.groupInvitation.findFirst({
      where: {
        groupId,
        userId,
        status: { in: ['pending', 'accepted'] }
      }
    });
    if (existingRequest) {
      return response.status(409).json({ message: 'Request already exists or user already invited' });
    }

    // Create join request (same table, but conceptually different)
    const joinRequest = await prisma.groupInvitation.create({
      data: {
        groupId,
        userId,
        status: 'pending',
        type: 'join_request' // User requests to join group
      }
    });

    response.status(201).json({
      message: 'Join request sent successfully',
      requestId: joinRequest.id
    });

  } catch (error) {
    console.error('Error creating join request:', error);
    response.status(500).json({ message: 'Error sending join request' });
  }
});

// Cancel a join request (user cancels their own request)
router.delete('/cancel/:groupId/:userId', async (request: Request, response: Response) => {
  try {
    const { groupId, userId } = request.params;
    if (!groupId || !userId) {
      return response.status(400).json({ message: 'groupId and userId are required' });
    }

    // Find the join request and verify it belongs to the user
    const joinRequest = await prisma.groupInvitation.findFirst({
      where: {
        groupId,
        userId,
        type: 'join_request',
        status: 'pending' // Only allow canceling pending requests
      }
    });

    if (!joinRequest) {
      return response.status(404).json({
        message: 'Join request not found or cannot be canceled'
      });
    }

    // Delete the join request
    await prisma.groupInvitation.delete({
      where: { id: joinRequest.id }
    });

    response.status(200).json({
      message: 'Join request canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling join request:', error);
    response.status(500).json({ message: 'Error canceling join request' });
  }
});

export default router