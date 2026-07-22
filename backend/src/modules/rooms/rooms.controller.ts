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
  res.json(await roomsService.setHousekeeping(req.params.id, req.body.housekeeping));
}
