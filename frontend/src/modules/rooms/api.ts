import { apiClient } from "../../shared/api/client";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
export type HousekeepingStatus = "CLEAN" | "NOT_CLEAN" | "IN_PROGRESS" | "REPAIR";
export type BookingStatus = "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type RoomSupplyCategory = "LINEN" | "TOILETRIES" | "AMENITIES" | "CLEANING";

export interface RoomType {
  id: string;
  name: string;
  basePrice: string;
  capacity: number;
  description?: string | null;
}

export interface Guest {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  idNumber?: string | null;
}

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  guest: Guest;
  room?: Room;
  checkInAt: string;
  expectedCheckOutAt: string;
  checkOutAt: string | null;
  ratePerNight: string;
  isShortStay: boolean;
  status: BookingStatus;
  notes?: string | null;
  folioCharges?: FolioCharge[];
}

export interface Room {
  id: string;
  number: string;
  keyNumber: string;
  floor: number;
  status: RoomStatus;
  housekeeping: HousekeepingStatus;
  roomTypeId: string;
  roomType: RoomType;
  bookings?: Booking[];
}

export interface FolioCharge {
  id: string;
  bookingId: string;
  sourceModule: "ROOM" | "RESTAURANT";
  description: string;
  amount: string;
  createdAt: string;
}

export interface Folio {
  booking: Booking;
  nights: number;
  roomTotal: number;
  chargesTotal: number;
  grandTotal: number;
}

export interface RoomSupplyItem {
  id: string;
  name: string;
  category: RoomSupplyCategory;
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  costPrice: string;
}

export interface RoomSupplyRequirement {
  id: string;
  roomTypeId: string;
  roomType: RoomType;
  supplyItemId: string;
  supplyItem: RoomSupplyItem;
  quantityPerClean: number;
}

export const roomsApi = {
  listRoomTypes: () => apiClient.get<RoomType[]>("/rooms/types").then((r) => r.data),
  createRoomType: (data: { name: string; basePrice: number; capacity: number; description?: string }) =>
    apiClient.post<RoomType>("/rooms/types", data).then((r) => r.data),
  listRooms: () => apiClient.get<Room[]>("/rooms").then((r) => r.data),
  createRoom: (data: { number: string; keyNumber: string; floor: number; roomTypeId: string }) =>
    apiClient.post<Room>("/rooms", data).then((r) => r.data),
  listBookings: (activeOnly = false) =>
    apiClient.get<Booking[]>("/rooms/bookings", { params: { active: activeOnly } }).then((r) => r.data),
  checkIn: (data: {
    roomId: string;
    guest: { fullName: string; phone?: string; email?: string; idNumber?: string };
    expectedCheckOutAt: string;
    ratePerNight: number;
    isShortStay?: boolean;
    notes?: string;
  }) => apiClient.post<Booking>("/rooms/bookings", data).then((r) => r.data),
  getFolio: (bookingId: string) => apiClient.get<Folio>(`/rooms/bookings/${bookingId}/folio`).then((r) => r.data),
  checkOut: (bookingId: string) => apiClient.post<Booking>(`/rooms/bookings/${bookingId}/checkout`).then((r) => r.data),
  setRoomStatus: (roomId: string, status: "AVAILABLE" | "CLEANING" | "MAINTENANCE") =>
    apiClient.patch<Room>(`/rooms/${roomId}/status`, { status }).then((r) => r.data),
  setHousekeeping: (roomId: string, housekeeping: HousekeepingStatus) =>
    apiClient.patch<Room>(`/rooms/${roomId}/housekeeping`, { housekeeping }).then((r) => r.data),

  listSupplyItems: () => apiClient.get<RoomSupplyItem[]>("/rooms/supplies").then((r) => r.data),
  createSupplyItem: (data: {
    name: string;
    category: RoomSupplyCategory;
    unit: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    costPrice?: number;
  }) => apiClient.post<RoomSupplyItem>("/rooms/supplies", data).then((r) => r.data),
  adjustSupplyStock: (supplyItemId: string, data: { quantityChange: number; reason: string }) =>
    apiClient.post<RoomSupplyItem>(`/rooms/supplies/${supplyItemId}/adjustments`, data).then((r) => r.data),

  listSupplyRequirements: () =>
    apiClient.get<RoomSupplyRequirement[]>("/rooms/supply-requirements").then((r) => r.data),
  upsertSupplyRequirement: (data: { roomTypeId: string; supplyItemId: string; quantityPerClean: number }) =>
    apiClient.post<RoomSupplyRequirement>("/rooms/supply-requirements", data).then((r) => r.data),
  deleteSupplyRequirement: (id: string) => apiClient.delete(`/rooms/supply-requirements/${id}`),
};
