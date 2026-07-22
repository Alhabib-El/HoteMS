import { apiClient } from "../../shared/api/client";

export interface Summary {
  date: string;
  // Guest-facing revenue only (room charges + restaurant, which includes bar retail sales).
  revenue: { room: number | null; restaurant: number | null; total: number | null };
  occupancy: { occupied: number; totalRooms: number; rate: number } | null;
  // Liquor stores are wholesale suppliers, not guest-facing — this is an operational
  // view (stock shipped to the restaurant), not revenue, so it's kept separate.
  liquor: { wholesaleValue: number | null; lowStockCount: number | null };
  lowStock: { restaurant: number | null; roomSupplies: number | null; ingredients: number | null };
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

export interface LowStockRoomSupply {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  category: string;
}

export interface LowStockIngredient {
  id: string;
  name: string;
  unit: string;
  stockQuantity: string;
  lowStockThreshold: string;
  category: string;
}

export interface LowStockReport {
  liquor: LowStockLiquorProduct[] | null;
  restaurant: LowStockMenuItem[] | null;
  roomSupplies: LowStockRoomSupply[] | null;
  ingredients: LowStockIngredient[] | null;
}

export interface Kpis {
  from: string;
  to: string;
  revenue: { room: number | null; restaurant: number | null; total: number | null };
  adr: number | null;
  revPar: number | null;
  avgOccupancy: number | null;
}

export interface OccupancyTrendDay {
  date: string;
  occupied: number;
  totalRooms: number;
  rate: number;
}

export interface BookingRef {
  id: string;
  checkInAt: string;
  expectedCheckOutAt: string;
  checkOutAt: string | null;
  ratePerNight: string;
  isShortStay: boolean;
  status: string;
  guest: { fullName: string };
  room?: { number: string; roomType: { name: string } } | null;
}

export interface ArrivalsDepartures {
  arrivals: BookingRef[];
  departures: BookingRef[];
  avgLengthOfStay: number;
  shortStayCount: number;
  overnightCount: number;
}

export interface RestaurantSalesReport {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  salesByCategory: { category: string; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  paymentsByMethod: { method: string; amount: number }[];
}

export interface VoidedItem {
  id: string;
  quantity: number;
  unitPrice: string;
  voidReason: string | null;
  voidedAt: string | null;
  menuItem: { name: string };
  order: { id: string; tableId: string | null };
}

export interface VoidReport {
  items: VoidedItem[];
  count: number;
  totalValueVoided: number;
}

export interface LiquorTransferRef {
  id: string;
  quantity: number;
  wholesalePrice: string;
  retailPrice: string;
  createdAt: string;
  store: { name: string };
  product: { name: string };
  staff: { fullName: string };
}

export interface LiquorReport {
  transfers: LiquorTransferRef[];
  totalWholesaleValue: number;
  totalRetailValue: number;
  stockValuation: { storeId: string; storeName: string; valuationAtCost: number; valuationAtWholesale: number }[];
}

export interface StaffHours {
  staffId: string;
  fullName: string;
  role: string;
  hours: number;
}

export interface UpcomingLeaveRef {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  staff: { fullName: string };
}

export interface LaborReport {
  staffHours: StaffHours[];
  totalHours: number;
  openShiftsCount: number;
  upcomingLeave: UpcomingLeaveRef[];
}

export const reportingApi = {
  getSummary: () => apiClient.get<Summary>("/reporting/summary").then((r) => r.data),
  getRevenueByDay: (from?: string, to?: string) =>
    apiClient.get<RevenueDay[]>("/reporting/revenue", { params: { from, to } }).then((r) => r.data),
  getLowStock: () => apiClient.get<LowStockReport>("/reporting/low-stock").then((r) => r.data),
  getKpis: (from?: string, to?: string) => apiClient.get<Kpis>("/reporting/kpis", { params: { from, to } }).then((r) => r.data),
  downloadRevenueCsv: async (from?: string, to?: string) => {
    const response = await apiClient.get("/reporting/export/revenue.csv", { params: { from, to }, responseType: "blob" });
    const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `revenue-${from ?? "recent"}-to-${to ?? "today"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  getOccupancyTrend: (from?: string, to?: string) =>
    apiClient.get<OccupancyTrendDay[]>("/reporting/occupancy-trend", { params: { from, to } }).then((r) => r.data),
  getArrivalsDepartures: (from?: string, to?: string) =>
    apiClient.get<ArrivalsDepartures>("/reporting/arrivals-departures", { params: { from, to } }).then((r) => r.data),

  getRestaurantSalesReport: (from?: string, to?: string) =>
    apiClient.get<RestaurantSalesReport>("/reporting/restaurant-sales", { params: { from, to } }).then((r) => r.data),
  getVoidReport: (from?: string, to?: string) =>
    apiClient.get<VoidReport>("/reporting/void-report", { params: { from, to } }).then((r) => r.data),

  getLiquorReport: (from?: string, to?: string) =>
    apiClient.get<LiquorReport>("/reporting/liquor-report", { params: { from, to } }).then((r) => r.data),

  getLaborReport: (from?: string, to?: string) =>
    apiClient.get<LaborReport>("/reporting/labor-report", { params: { from, to } }).then((r) => r.data),
};
