import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import groupRoutes from "./routes/group.js";
import { errorHandler, notFound } from "./utils/errorHandler.js";
import prisma from "./lib/prisma.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Protected routes
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Connect to the database and start the server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Connected to the database");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
