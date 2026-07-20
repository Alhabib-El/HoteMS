import { Request, Response } from "express";
import * as service from "./reporting.service";

export async function getSummary(req: Request, res: Response) {
  res.json(await service.getSummary(req.staff!.role));
}

export async function getRevenue(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getRevenueByDay(req.staff!.role, from, to));
}

export async function getLowStock(req: Request, res: Response) {
  res.json(await service.getLowStockReport(req.staff!.role));
}
