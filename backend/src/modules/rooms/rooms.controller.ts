import { Request, Response } from "express";
import * as roomsService from "./rooms.service";

export async function getRoomTypes(_req: Request, res: Response) {
  res.json(await roomsService.listRoomTypes());
}

export async function postRoomType(req: Request, res: Response) {
  res.status(201).json(await roomsService.createRoomType(req.body));
}

export async function getRooms(_req: Request, res: Response) {
  res.json(await roomsService.listRooms());
}

export async function postRoom(req: Request, res: Response) {
  res.status(201).json(await roomsService.createRoom(req.body));
}

export async function getBookings(req: Request, res: Response) {
  const activeOnly = req.query.active === "true";
  res.json(await roomsService.listBookings(activeOnly));
}

export async function postBooking(req: Request, res: Response) {
  res.status(201).json(await roomsService.checkIn(req.body));
}

export async function getFolio(req: Request, res: Response) {
  res.json(await roomsService.getFolio(req.params.id));
}

export async function postFolioCharge(req: Request, res: Response) {
  res.status(201).json(await roomsService.addFolioCharge(req.params.id, req.body));
}

export async function postCheckOut(req: Request, res: Response) {
  res.json(await roomsService.checkOut(req.params.id));
}

export async function patchRoomStatus(req: Request, res: Response) {
  res.json(await roomsService.setRoomStatus(req.params.id, req.body.status));
}

export async function patchHousekeeping(req: Request, res: Response) {
  res.json(await roomsService.setHousekeeping(req.params.id, req.body.housekeeping, req.staff?.id));
}

export async function getSupplyItems(_req: Request, res: Response) {
  res.json(await roomsService.listSupplyItems());
}

export async function postSupplyItem(req: Request, res: Response) {
  res.status(201).json(await roomsService.createSupplyItem(req.body));
}

export async function postSupplyAdjustment(req: Request, res: Response) {
  res.status(201).json(
    await roomsService.adjustSupplyStock(req.params.id, { ...req.body, staffId: req.staff?.id })
  );
}

export async function getSupplyLowStock(_req: Request, res: Response) {
  res.json(await roomsService.listLowStockSupplies());
}

export async function getSupplyRequirements(_req: Request, res: Response) {
  res.json(await roomsService.listSupplyRequirements());
}

export async function postSupplyRequirement(req: Request, res: Response) {
  res.status(201).json(await roomsService.upsertSupplyRequirement(req.body));
}

export async function deleteSupplyRequirement(req: Request, res: Response) {
  await roomsService.deleteSupplyRequirement(req.params.id);
  res.status(204).end();
}
