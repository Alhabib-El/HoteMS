import { apiClient } from "../../shared/api/client";

export type TableStatus = "FREE" | "OCCUPIED";
export type OrderStatus = "OPEN" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "ROOM_CHARGE";
export type OrderItemPrepStatus = "RECEIVED" | "PREPARING" | "READY" | "SERVED";

export const PREP_STATUS_SEQUENCE: OrderItemPrepStatus[] = ["RECEIVED", "PREPARING", "READY", "SERVED"];
export type IngredientCategory = "PROTEIN" | "PRODUCE" | "DAIRY" | "PANTRY" | "BEVERAGE" | "FROZEN" | "BAKERY";

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  price: string;
  isAvailable: boolean;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  sourceLiquorProductId?: string | null;
  // null = unlimited / no recipe defined; otherwise how many more servings the kitchen can
  // currently make, computed from recipe ingredient stock.
  availablePortions?: number | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RestaurantTable {
  id: string;
  number: string;
  seats: number;
  status: TableStatus;
}

export interface RestaurantStaffMember {
  id: string;
  fullName: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: string;
  notes?: string | null;
  prepStatus: OrderItemPrepStatus;
  voided: boolean;
  voidReason?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  paidAt: string;
}

export interface Order {
  id: string;
  tableId?: string | null;
  table?: RestaurantTable | null;
  bookingId?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: RestaurantStaffMember | null;
  status: OrderStatus;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: string;
  stockQuantity: string;
  lowStockThreshold: string;
  costPerUnit: string;
  supplier?: string | null;
}

export interface RecipeLine {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  ingredientId: string;
  ingredient: Ingredient;
  quantityPerServing: string;
}

export const restaurantApi = {
  listCategories: () => apiClient.get<MenuCategory[]>("/restaurant/menu").then((r) => r.data),
  createCategory: (data: { name: string }) =>
    apiClient.post<MenuCategory>("/restaurant/menu/categories", data).then((r) => r.data),
  createMenuItem: (data: { name: string; categoryId: string; price: number }) =>
    apiClient.post<MenuItem>("/restaurant/menu/items", data).then((r) => r.data),

  listTables: () => apiClient.get<RestaurantTable[]>("/restaurant/tables").then((r) => r.data),
  listStaff: () => apiClient.get<RestaurantStaffMember[]>("/restaurant/staff").then((r) => r.data),

  listOrders: (openOnly = false) =>
    apiClient.get<Order[]>("/restaurant/orders", { params: { open: openOnly } }).then((r) => r.data),
  openOrder: (data: { tableId?: string; bookingId?: string; assignedStaffId?: string }) =>
    apiClient.post<Order>("/restaurant/orders", data).then((r) => r.data),
  linkBooking: (orderId: string, bookingId: string) =>
    apiClient.post<Order>(`/restaurant/orders/${orderId}/link-booking`, { bookingId }).then((r) => r.data),
  assignStaff: (orderId: string, staffId: string) =>
    apiClient.post<Order>(`/restaurant/orders/${orderId}/assign`, { staffId }).then((r) => r.data),
  addOrderItem: (orderId: string, data: { menuItemId: string; quantity: number; notes?: string }) =>
    apiClient.post(`/restaurant/orders/${orderId}/items`, data).then((r) => r.data),
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemPrepStatus) =>
    apiClient.patch(`/restaurant/orders/${orderId}/items/${itemId}/status`, { status }).then((r) => r.data),
  voidItem: (orderId: string, itemId: string, reason: string) =>
    apiClient.post(`/restaurant/orders/${orderId}/items/${itemId}/void`, { reason }).then((r) => r.data),
  addPayment: (orderId: string, data: { amount: number; method: PaymentMethod }) =>
    apiClient.post<Order>(`/restaurant/orders/${orderId}/payments`, data).then((r) => r.data),

  listIngredients: () => apiClient.get<Ingredient[]>("/restaurant/ingredients").then((r) => r.data),
  createIngredient: (data: {
    name: string;
    category: IngredientCategory;
    unit: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    costPerUnit?: number;
    supplier?: string;
  }) => apiClient.post<Ingredient>("/restaurant/ingredients", data).then((r) => r.data),
  adjustIngredientStock: (ingredientId: string, data: { quantityChange: number; reason: string }) =>
    apiClient.post<Ingredient>(`/restaurant/ingredients/${ingredientId}/adjustments`, data).then((r) => r.data),

  listRecipes: () => apiClient.get<RecipeLine[]>("/restaurant/recipes").then((r) => r.data),
  upsertRecipeLine: (data: { menuItemId: string; ingredientId: string; quantityPerServing: number }) =>
    apiClient.post<RecipeLine>("/restaurant/recipes", data).then((r) => r.data),
  deleteRecipeLine: (id: string) => apiClient.delete(`/restaurant/recipes/${id}`),
};
