import { Request, Response } from "express";
import * as service from "./staff.service";

export async function getStaff(_req: Request, res: Response) {
  res.json(await service.listStaff());
}

export async function postStaff(req: Request, res: Response) {
  res.status(201).json(await service.createStaff(req.body));
}

export async function patchStaffActive(req: Request, res: Response) {
  res.json(await service.setStaffActive(req.params.id, req.body.active));
}
