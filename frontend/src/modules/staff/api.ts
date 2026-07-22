import { apiClient } from "../../shared/api/client";
import { StaffRole } from "../../shared/auth/authApi";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CASUAL" | "CONTRACT";
export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT";
export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StaffMember {
  id: string;
  fullName: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  employeeNumber?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  dateHired?: string | null;
  employmentType: EmploymentType;
  baseSalary?: string | null;
  annualLeaveDays: number;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface StaffProfileInput {
  fullName?: string;
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
}

export interface StaffRef {
  id: string;
  fullName: string;
  role: StaffRole;
}

export interface Shift {
  id: string;
  staffId: string;
  staff?: StaffRef;
  date: string;
  shiftType: ShiftType;
  notes?: string | null;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staff?: StaffRef;
  clockInAt: string;
  clockOutAt: string | null;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staff?: StaffRef;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: LeaveStatus;
  reviewedBy?: { id: string; fullName: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  entitlement: number;
  used: number;
  remaining: number;
}

export interface StaffDetail {
  staff: StaffMember;
  shifts: Shift[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalance: LeaveBalance;
}

export const staffApi = {
  list: () => apiClient.get<StaffMember[]>("/staff").then((r) => r.data),
  create: (data: { fullName: string; role: StaffRole; pin: string } & StaffProfileInput) =>
    apiClient.post<StaffMember>("/staff", data).then((r) => r.data),
  setActive: (id: string, active: boolean) =>
    apiClient.patch<StaffMember>(`/staff/${id}/active`, { active }).then((r) => r.data),
  updateProfile: (id: string, data: StaffProfileInput) =>
    apiClient.patch<StaffMember>(`/staff/${id}`, data).then((r) => r.data),
  getDetail: (id: string) => apiClient.get<StaffDetail>(`/staff/${id}`).then((r) => r.data),

  // Shifts (management)
  listShifts: (params: { staffId?: string; from?: string; to?: string } = {}) =>
    apiClient.get<Shift[]>("/staff/shifts", { params }).then((r) => r.data),
  upsertShift: (data: { staffId: string; date: string; shiftType: ShiftType; notes?: string }) =>
    apiClient.post<Shift>("/staff/shifts", data).then((r) => r.data),
  deleteShift: (id: string) => apiClient.delete(`/staff/shifts/${id}`),

  // Attendance (management)
  listAttendance: (params: { staffId?: string; from?: string; to?: string } = {}) =>
    apiClient.get<AttendanceRecord[]>("/staff/attendance", { params }).then((r) => r.data),

  // Leave (management)
  listLeaveRequests: (params: { staffId?: string; status?: LeaveStatus } = {}) =>
    apiClient.get<LeaveRequest[]>("/staff/leave-requests", { params }).then((r) => r.data),
  reviewLeaveRequest: (id: string, status: "APPROVED" | "REJECTED") =>
    apiClient.patch<LeaveRequest>(`/staff/leave-requests/${id}`, { status }).then((r) => r.data),

  // Self-service
  clockIn: () => apiClient.post<AttendanceRecord>("/staff/attendance/clock-in").then((r) => r.data),
  clockOut: () => apiClient.post<AttendanceRecord>("/staff/attendance/clock-out").then((r) => r.data),
  myAttendanceStatus: () =>
    apiClient.get<AttendanceRecord | null>("/staff/attendance/me/status").then((r) => r.data),
  myAttendance: () => apiClient.get<AttendanceRecord[]>("/staff/attendance/me").then((r) => r.data),
  myShifts: (params: { from?: string; to?: string } = {}) =>
    apiClient.get<Shift[]>("/staff/shifts/me", { params }).then((r) => r.data),
  myLeaveRequests: () => apiClient.get<LeaveRequest[]>("/staff/leave-requests/me").then((r) => r.data),
  myLeaveBalance: () => apiClient.get<LeaveBalance>("/staff/leave-balance/me").then((r) => r.data),
  requestLeave: (data: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post<LeaveRequest>("/staff/leave-requests", data).then((r) => r.data),
};
