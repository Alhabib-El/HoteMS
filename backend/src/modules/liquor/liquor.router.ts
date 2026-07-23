import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./liquor.controller";

export const liquorRouter = Router();

liquorRouter.use(requireRole("LIQUOR"));

liquorRouter.get("/stores", asyncHandler(controller.getStores));
liquorRouter.post("/stores", asyncHandler(controller.postStore));

liquorRouter.get("/stores/:storeId/products", asyncHandler(controller.getProducts));
liquorRouter.post("/stores/:storeId/products", asyncHandler(controller.postProduct));
liquorRouter.post("/stores/:storeId/products/:productId/transfer", asyncHandler(controller.postTransfer));

liquorRouter.get("/stores/:storeId/transfers", asyncHandler(controller.getTransfers));

liquorRouter.patch("/products/:id/featured", asyncHandler(controller.patchFeatured));
liquorRouter.post("/products/:id/stock-adjustments", asyncHandler(controller.postStockAdjustment));
liquorRouter.get("/low-stock", asyncHandler(controller.getLowStock));
