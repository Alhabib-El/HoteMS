import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "./auth.middleware";
import * as controller from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(controller.postLogin));
authRouter.get("/me", requireAuth, controller.getMe);
