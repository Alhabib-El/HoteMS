import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./modules/auth/auth.middleware";
import { authRouter } from "./modules/auth/auth.router";
import { staffRouter } from "./modules/staff/staff.router";
import { roomsRouter } from "./modules/rooms/rooms.router";
import { restaurantRouter } from "./modules/restaurant/restaurant.router";
import { liquorRouter } from "./modules/liquor/liquor.router";
import { reportingRouter } from "./modules/reporting/reporting.router";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);

  app.use("/api", requireAuth);

  app.use("/api/staff", staffRouter);
  app.use("/api/rooms", roomsRouter);
  app.use("/api/restaurant", restaurantRouter);
  app.use("/api/liquor", liquorRouter);
  app.use("/api/reporting", reportingRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
