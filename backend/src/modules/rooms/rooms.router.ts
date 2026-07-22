import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./rooms.controller";

export const roomsRouter = Router();

// Any authenticated staff can look up active bookings (needed to charge a restaurant order to a room).
roomsRouter.get("/bookings", asyncHandler(controller.getBookings));

roomsRouter.use(requireRole("ROOMS"));

roomsRouter.get("/types", asyncHandler(controller.getRoomTypes));
roomsRouter.post("/types", asyncHandler(controller.postRoomType));

roomsRouter.get("/", asyncHandler(controller.getRooms));
roomsRouter.post("/", asyncHandler(controller.postRoom));
roomsRouter.patch("/:id/status", asyncHandler(controller.patchRoomStatus));
roomsRouter.patch("/:id/housekeeping", asyncHandler(controller.patchHousekeeping));

roomsRouter.post("/bookings", asyncHandler(controller.postBooking));
roomsRouter.get("/bookings/:id/folio", asyncHandler(controller.getFolio));
roomsRouter.post("/bookings/:id/charges", asyncHandler(controller.postFolioCharge));
roomsRouter.post("/bookings/:id/checkout", asyncHandler(controller.postCheckOut));
