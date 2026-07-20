import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import * as controller from "./reporting.controller";

export const reportingRouter = Router();

reportingRouter.get("/summary", asyncHandler(controller.getSummary));
reportingRouter.get("/revenue", asyncHandler(controller.getRevenue));
reportingRouter.get("/low-stock", asyncHandler(controller.getLowStock));
