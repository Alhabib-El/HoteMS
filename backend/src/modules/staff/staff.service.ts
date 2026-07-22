import bcrypt from "bcryptjs";
import { EmploymentType, LeaveStatus, LeaveType, ShiftType, StaffRole } from "@prisma/client";
import { prisma } from "../../db/client";
import { HttpError } from "../../middleware/errorHandler";

const staffSelect = {
  id: true,
  fullName: true,
  role: true,
  active: true,
  createdAt: true,
  employeeNumber: true,
  jobTitle: true,
  phone: true,
  email: true,
  address: true,
  dateOfBirth: true,
  nationalId: true,
  dateHired: true,
  employmentType: true,
  baseSalary: true,
  annualLeaveDays: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
} as const;

export function listStaff() {
  return prisma.staff.findMany({ select: staffSelect, orderBy: { fullName: "asc" } });
}

export async function createStaff(data: {
  fullName: string;
  role: StaffRole;
  pin: string;
  employeeNumber?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  nationalId?: string;
  dateHired?: string;
  employmentType?: EmploymentType;
  baseSalary?: number;
  annualLeaveDays?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}) {
  const { pin, ...profile } = data;
  const pinHash = await bcrypt.hash(pin, 10);
  return prisma.staff.create({
    data: {
      ...profile,
      pinHash,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateHired: data.dateHired ? new Date(data.dateHired) : undefined,
    },
    select: staffSelect,
  });
}

export function setStaffActive(id: string, active: boolean) {
  return prisma.staff.update({ where: { id }, data: { active }, select: staffSelect });
}

export function updateStaffProfile(
  id: string,
  data: Partial<{
    fullName: string;
    employeeNumber: string;
    jobTitle: string;
    phone: string;
    email: string;
    address: string;
    dateOfBirth: string;
    nationalId: string;
    dateHired: string;
    employmentType: EmploymentType;
    baseSalary: number;
    annualLeaveDays: number;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
  }>
) {
  return prisma.staff.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateHired: data.dateHired ? new Date(data.dateHired) : undefined,
    },
    select: staffSelect,
  });
}

export async function getStaffDetail(id: string) {
  const staff = await prisma.staff.findUnique({ where: { id }, select: staffSelect });
  if (!staff) throw new HttpError(404, "Staff member not found");

  const [shifts, attendance, leaveRequests] = await Promise.all([
    prisma.staffShift.findMany({ where: { staffId: id }, orderBy: { date: "desc" }, take: 14 }),
    prisma.attendanceRecord.findMany({ where: { staffId: id }, orderBy: { clockInAt: "desc" }, take: 10 }),
    prisma.leaveRequest.findMany({
      where: { staffId: id },
      include: { reviewedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { staff, shifts, attendance, leaveRequests, leaveBalance: await getLeaveBalance(id) };
}

// ── Shifts / roster ─────────────────────────────────────────────────────

export function listShifts(filters: { staffId?: string; from?: string; to?: string }) {
  return prisma.staffShift.findMany({
    where: {
      staffId: filters.staffId,
      date: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      },
    },
    include: { staff: { select: { id: true, fullName: true, role: true } } },
    orderBy: { date: "asc" },
  });
}

export function listMyShifts(staffId: string, from?: string, to?: string) {
  return listShifts({ staffId, from, to });
}

export function upsertShift(data: { staffId: string; date: string; shiftType: ShiftType; notes?: string }) {
  const date = new Date(data.date);
  return prisma.staffShift.upsert({
    where: { staffId_date: { staffId: data.staffId, date } },
    create: { staffId: data.staffId, date, shiftType: data.shiftType, notes: data.notes },
    update: { shiftType: data.shiftType, notes: data.notes },
    include: { staff: { select: { id: true, fullName: true, role: true } } },
  });
}

export function deleteShift(id: string) {
  return prisma.staffShift.delete({ where: { id } });
}

// ── Attendance / time clock ─────────────────────────────────────────────

export async function clockIn(staffId: string) {
  const open = await prisma.attendanceRecord.findFirst({ where: { staffId, clockOutAt: null } });
  if (open) throw new HttpError(409, "Already clocked in");
  return prisma.attendanceRecord.create({ data: { staffId } });
}

export async function clockOut(staffId: string) {
  const open = await prisma.attendanceRecord.findFirst({
    where: { staffId, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
  if (!open) throw new HttpError(409, "Not currently clocked in");
  return prisma.attendanceRecord.update({ where: { id: open.id }, data: { clockOutAt: new Date() } });
}

export function getMyOpenAttendance(staffId: string) {
  return prisma.attendanceRecord.findFirst({ where: { staffId, clockOutAt: null } });
}

export function listAttendance(filters: { staffId?: string; from?: string; to?: string }) {
  return prisma.attendanceRecord.findMany({
    where: {
      staffId: filters.staffId,
      clockInAt: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      },
    },
    include: { staff: { select: { id: true, fullName: true, role: true } } },
    orderBy: { clockInAt: "desc" },
  });
}

// ── Leave requests ──────────────────────────────────────────────────────

export async function createLeaveRequest(
  staffId: string,
  data: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string }
) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (endDate < startDate) throw new HttpError(400, "End date must be on or after start date");

  return prisma.leaveRequest.create({
    data: { staffId, leaveType: data.leaveType, startDate, endDate, reason: data.reason },
  });
}

export function listLeaveRequests(filters: { staffId?: string; status?: LeaveStatus }) {
  return prisma.leaveRequest.findMany({
    where: { staffId: filters.staffId, status: filters.status },
    include: {
      staff: { select: { id: true, fullName: true, role: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewLeaveRequest(
  id: string,
  data: { status: "APPROVED" | "REJECTED"; reviewedById: string }
) {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request) throw new HttpError(404, "Leave request not found");
  if (request.status !== "PENDING") throw new HttpError(409, "Leave request has already been reviewed");

  return prisma.leaveRequest.update({
    where: { id },
    data: { status: data.status, reviewedById: data.reviewedById, reviewedAt: new Date() },
    include: { staff: { select: { id: true, fullName: true } }, reviewedBy: { select: { id: true, fullName: true } } },
  });
}

function daysInclusive(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export async function getLeaveBalance(staffId: string) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { annualLeaveDays: true } });
  if (!staff) throw new HttpError(404, "Staff member not found");

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear(), 11, 31);
  const approved = await prisma.leaveRequest.findMany({
    where: { staffId, leaveType: "ANNUAL", status: "APPROVED", startDate: { gte: yearStart, lte: yearEnd } },
  });
  const used = approved.reduce((sum, r) => sum + daysInclusive(r.startDate, r.endDate), 0);

  return { entitlement: staff.annualLeaveDays, used, remaining: Math.max(0, staff.annualLeaveDays - used) };
}
