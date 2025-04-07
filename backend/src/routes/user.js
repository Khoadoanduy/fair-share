import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { userService } from "../services/userService.js";
import { ApiError } from "../utils/errorHandler.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

/**
 * Get current user profile
 */
router.get("/profile", async (req, res, next) => {
  try {
    // User information is available in req.user thanks to the authMiddleware
    res.status(200).json({
      message: "User profile retrieved successfully",
      user: {
        id: req.user.id,
        clerkId: req.user.clerkId,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 */
router.patch("/profile", async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
      },
    });

    res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user dashboard data
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    // Get user's groups
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

    // Get user's recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: {
        OR: [
          { paidById: req.user.id },
          {
            shares: {
              some: {
                userId: req.user.id,
              },
            },
          },
        ],
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
      include: {
        paidBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      message: `Welcome to your dashboard, ${req.user.firstName || "User"}!`,
      userId: req.user.id,
      groups,
      recentExpenses,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
