import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./restaurant.controller";

export const restaurantRouter = Router();

restaurantRouter.use(requireRole("RESTAURANT"));

restaurantRouter.get("/staff", asyncHandler(controller.getRestaurantStaff));

restaurantRouter.get("/menu", asyncHandler(controller.getCategories));
restaurantRouter.post("/menu/categories", asyncHandler(controller.postCategory));
restaurantRouter.post("/menu/items", asyncHandler(controller.postMenuItem));

restaurantRouter.get("/tables", asyncHandler(controller.getTables));
restaurantRouter.post("/tables", asyncHandler(controller.postTable));

restaurantRouter.get("/orders", asyncHandler(controller.getOrders));
restaurantRouter.post("/orders", asyncHandler(controller.postOrder));
restaurantRouter.post("/orders/:id/link-booking", asyncHandler(controller.postOrderLinkBooking));
restaurantRouter.post("/orders/:id/assign", asyncHandler(controller.postOrderAssign));
restaurantRouter.post("/orders/:id/items", asyncHandler(controller.postOrderItem));
restaurantRouter.patch("/orders/:id/items/:itemId/status", asyncHandler(controller.patchOrderItemStatus));
restaurantRouter.post("/orders/:id/items/:itemId/void", asyncHandler(controller.postOrderItemVoid));
restaurantRouter.post("/orders/:id/payments", asyncHandler(controller.postOrderPayment));
