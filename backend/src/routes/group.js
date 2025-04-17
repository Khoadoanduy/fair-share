import express from "express";
import { authMiddleware } from "../middleware/auth.js";
//import { ApiError } from "../utils/errorHandler.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

/**
 * Get all groups for the current user
 */
router.get("/", async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            expenses: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Groups retrieved successfully",
      groups,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new group
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new ApiError(400, "Group name is required");
    }

    // Create the group and add the current user as an admin
    const group = await prisma.$transaction(async (tx) => {
      // Create the group
      const newGroup = await tx.group.create({
        data: {
          name,
          description,
          createdById: req.user.id,
        },
      });

      // Add the creator as an admin member
      await tx.groupMember.create({
        data: {
          userId: req.user.id,
          groupId: newGroup.id,
          role: "ADMIN",
        },
      });

      return newGroup;
    });

    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a specific group by ID
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user.id,
          groupId: id,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this group");
    }

    // Get the group with members and expenses
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        expenses: {
          orderBy: {
            date: "desc",
          },
          include: {
            paidBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            shares: true,
          },
        },
      },
    });

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    res.status(200).json({
      message: "Group retrieved successfully",
      group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update a group
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if the user is an admin of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user.id,
          groupId: id,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this group");
    }

    if (membership.role !== "ADMIN") {
      throw new ApiError(403, "Only group admins can update the group");
    }

    // Update the group
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add a member to a group
 */
router.post("/:id/members", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role = "MEMBER" } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    // Check if the user is an admin of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user.id,
          groupId: id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      throw new ApiError(403, "Only group admins can add members");
    }

    // Find the user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new ApiError(404, "User not found");
    }

    // Check if the user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToAdd.id,
          groupId: id,
        },
      },
    });

    if (existingMembership) {
      throw new ApiError(400, "User is already a member of this group");
    }

    // Add the user to the group
    const newMembership = await prisma.groupMember.create({
      data: {
        userId: userToAdd.id,
        groupId: id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Member added successfully",
      membership: newMembership,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
