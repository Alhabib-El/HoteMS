import { apiClient } from "../../shared/api/client";

export interface Summary {
  date: string;
  // Guest-facing revenue only (room charges + restaurant, which includes bar retail sales).
  revenue: { room: number | null; restaurant: number | null; total: number | null };
  occupancy: { occupied: number; totalRooms: number; rate: number } | null;
  // Liquor stores are wholesale suppliers, not guest-facing — this is an operational
  // view (stock shipped to the restaurant), not revenue, so it's kept separate.
  liquor: { wholesaleValue: number | null; lowStockCount: number | null };
  lowStock: { restaurant: number | null };
}

export interface RevenueDay {
  date: string;
  room: number | null;
  restaurant: number | null;
}

export interface LowStockLiquorProduct {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  store: { name: string };
}

export interface LowStockMenuItem {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  category: { name: string };
}

export interface LowStockReport {
  liquor: LowStockLiquorProduct[] | null;
  restaurant: LowStockMenuItem[] | null;
}

export const reportingApi = {
  getSummary: () => apiClient.get<Summary>("/reporting/summary").then((r) => r.data),
  getRevenueByDay: (from?: string, to?: string) =>
    apiClient.get<RevenueDay[]>("/reporting/revenue", { params: { from, to } }).then((r) => r.data),
  getLowStock: () => apiClient.get<LowStockReport>("/reporting/low-stock").then((r) => r.data),
};
