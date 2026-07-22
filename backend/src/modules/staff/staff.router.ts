import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./staff.controller";

export const staffRouter = Router();

// Self-service — any authenticated staff member acting on their own record.
staffRouter.post("/attendance/clock-in", asyncHandler(controller.postClockIn));
staffRouter.post("/attendance/clock-out", asyncHandler(controller.postClockOut));
staffRouter.get("/attendance/me/status", asyncHandler(controller.getMyAttendanceStatus));
staffRouter.get("/attendance/me", asyncHandler(controller.getMyAttendance));
staffRouter.get("/shifts/me", asyncHandler(controller.getMyShifts));
staffRouter.post("/leave-requests", asyncHandler(controller.postLeaveRequest));
staffRouter.get("/leave-requests/me", asyncHandler(controller.getMyLeaveRequests));
staffRouter.get("/leave-balance/me", asyncHandler(controller.getMyLeaveBalance));

// Everything below is Management-only.
staffRouter.use(requireRole("MANAGEMENT"));

staffRouter.get("/shifts", asyncHandler(controller.getShifts));
staffRouter.post("/shifts", asyncHandler(controller.postShift));
staffRouter.delete("/shifts/:id", asyncHandler(controller.deleteShift));

staffRouter.get("/attendance", asyncHandler(controller.getAttendance));

staffRouter.get("/leave-requests", asyncHandler(controller.getLeaveRequests));
staffRouter.patch("/leave-requests/:id", asyncHandler(controller.patchLeaveRequest));

staffRouter.get("/", asyncHandler(controller.getStaff));
staffRouter.post("/", asyncHandler(controller.postStaff));
staffRouter.get("/:id", asyncHandler(controller.getStaffDetail));
staffRouter.patch("/:id", asyncHandler(controller.patchStaffProfile));
staffRouter.patch("/:id/active", asyncHandler(controller.patchStaffActive));
