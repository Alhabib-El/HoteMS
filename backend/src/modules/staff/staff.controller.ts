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

export async function patchStaffProfile(req: Request, res: Response) {
  res.json(await service.updateStaffProfile(req.params.id, req.body));
}

export async function getStaffDetail(req: Request, res: Response) {
  res.json(await service.getStaffDetail(req.params.id));
}

// ── Shifts ──────────────────────────────────────────────────────────────

export async function getShifts(req: Request, res: Response) {
  const { staffId, from, to } = req.query as { staffId?: string; from?: string; to?: string };
  res.json(await service.listShifts({ staffId, from, to }));
}

export async function getMyShifts(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.listMyShifts(req.staff!.id, from, to));
}

export async function postShift(req: Request, res: Response) {
  res.status(201).json(await service.upsertShift(req.body));
}

export async function deleteShift(req: Request, res: Response) {
  await service.deleteShift(req.params.id);
  res.status(204).end();
}

// ── Attendance ──────────────────────────────────────────────────────────

export async function postClockIn(req: Request, res: Response) {
  res.status(201).json(await service.clockIn(req.staff!.id));
}

export async function postClockOut(req: Request, res: Response) {
  res.json(await service.clockOut(req.staff!.id));
}

export async function getMyAttendanceStatus(req: Request, res: Response) {
  res.json(await service.getMyOpenAttendance(req.staff!.id));
}

export async function getMyAttendance(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await service.listAttendance({ staffId: req.staff!.id, from, to }));
}

export async function getAttendance(req: Request, res: Response) {
  const { staffId, from, to } = req.query as { staffId?: string; from?: string; to?: string };
  res.json(await service.listAttendance({ staffId, from, to }));
}

// ── Leave ───────────────────────────────────────────────────────────────

export async function postLeaveRequest(req: Request, res: Response) {
  res.status(201).json(await service.createLeaveRequest(req.staff!.id, req.body));
}

export async function getMyLeaveRequests(req: Request, res: Response) {
  res.json(await service.listLeaveRequests({ staffId: req.staff!.id }));
}

export async function getMyLeaveBalance(req: Request, res: Response) {
  res.json(await service.getLeaveBalance(req.staff!.id));
}

export async function getLeaveRequests(req: Request, res: Response) {
  const { staffId, status } = req.query as { staffId?: string; status?: "PENDING" | "APPROVED" | "REJECTED" };
  res.json(await service.listLeaveRequests({ staffId, status }));
}

export async function patchLeaveRequest(req: Request, res: Response) {
  res.json(await service.reviewLeaveRequest(req.params.id, { status: req.body.status, reviewedById: req.staff!.id }));
}
