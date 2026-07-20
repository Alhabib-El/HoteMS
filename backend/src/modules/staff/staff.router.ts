import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./staff.controller";

export const staffRouter = Router();

staffRouter.use(requireRole("MANAGEMENT"));
staffRouter.get("/", asyncHandler(controller.getStaff));
staffRouter.post("/", asyncHandler(controller.postStaff));
staffRouter.patch("/:id/active", asyncHandler(controller.patchStaffActive));
