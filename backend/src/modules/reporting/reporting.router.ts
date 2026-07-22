import { Router } from "express";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireRole } from "../auth/auth.middleware";
import * as controller from "./reporting.controller";

export const reportingRouter = Router();

// Shared across all roles — each self-scopes its output by req.staff.role.
reportingRouter.get("/summary", asyncHandler(controller.getSummary));
reportingRouter.get("/revenue", asyncHandler(controller.getRevenue));
reportingRouter.get("/low-stock", asyncHandler(controller.getLowStock));
reportingRouter.get("/kpis", asyncHandler(controller.getKpis));

// Management-only: full revenue export.
reportingRouter.get("/export/revenue.csv", requireRole("MANAGEMENT"), asyncHandler(controller.getRevenueCsv));

// Department-specific detailed reports.
reportingRouter.get("/occupancy-trend", requireRole("ROOMS"), asyncHandler(controller.getOccupancyTrend));
reportingRouter.get("/arrivals-departures", requireRole("ROOMS"), asyncHandler(controller.getArrivalsDepartures));

reportingRouter.get("/restaurant-sales", requireRole("RESTAURANT"), asyncHandler(controller.getRestaurantSalesReport));
reportingRouter.get("/void-report", requireRole("RESTAURANT"), asyncHandler(controller.getVoidReport));

reportingRouter.get("/liquor-report", requireRole("LIQUOR"), asyncHandler(controller.getLiquorReport));

reportingRouter.get("/labor-report", requireRole("MANAGEMENT"), asyncHandler(controller.getLaborReport));
