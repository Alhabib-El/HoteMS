import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function postLogin(req: Request, res: Response) {
  const { pin } = req.body as { pin?: string };
  if (!pin) {
    res.status(400).json({ error: "PIN is required" });
    return;
  }
  res.json(await authService.login(pin));
}

export function getMe(req: Request, res: Response) {
  res.json(req.staff);
}
