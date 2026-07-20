import { apiClient } from "../api/client";

export type StaffRole = "MANAGEMENT" | "ROOMS" | "RESTAURANT" | "LIQUOR";

export interface AuthStaff {
  id: string;
  fullName: string;
  role: StaffRole;
}

export const authApi = {
  login: (pin: string) => apiClient.post<{ token: string; staff: AuthStaff }>("/auth/login", { pin }).then((r) => r.data),
  me: () => apiClient.get<AuthStaff>("/auth/me").then((r) => r.data),
};
