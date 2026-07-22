import { apiClient } from "../../shared/api/client";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
export type HousekeepingStatus = "CLEAN" | "NOT_CLEAN" | "IN_PROGRESS" | "REPAIR";
export type BookingStatus = "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

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
};
