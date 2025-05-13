import { Router } from "express";
import { UserRoutes } from "./user.routes";

export const router = Router();

router.use('/users', UserRoutes) 
