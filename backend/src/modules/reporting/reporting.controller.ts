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

export async function getKpis(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getKpis(req.staff!.role, from, to));
}

export async function getOccupancyTrend(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getOccupancyTrend(from, to));
}

export async function getArrivalsDepartures(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getArrivalsDepartures(from, to));
}

export async function getRestaurantSalesReport(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getRestaurantSalesReport(from, to));
}

export async function getVoidReport(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getVoidReport(from, to));
}

export async function getLiquorReport(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getLiquorReport(from, to));
}

export async function getLaborReport(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.getLaborReport(from, to));
}

export async function getRevenueCsv(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  const csv = await service.getRevenueCsv(from, to);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="revenue-${from ?? "recent"}-to-${to ?? "today"}.csv"`);
  res.send(csv);
}
