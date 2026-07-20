import { apiClient } from "../../shared/api/client";
import { StaffRole } from "../../shared/auth/authApi";

export interface StaffMember {
  id: string;
  fullName: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
}

export const staffApi = {
  list: () => apiClient.get<StaffMember[]>("/staff").then((r) => r.data),
  create: (data: { fullName: string; role: StaffRole; pin: string }) =>
    apiClient.post<StaffMember>("/staff", data).then((r) => r.data),
  setActive: (id: string, active: boolean) =>
    apiClient.patch<StaffMember>(`/staff/${id}/active`, { active }).then((r) => r.data),
};
