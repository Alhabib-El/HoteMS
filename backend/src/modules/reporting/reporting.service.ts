import { StaffRole } from "@prisma/client";
import { prisma } from "../../db/client";
import { getWholesaleValue, listLowStock } from "../liquor/liquor.service";
import { listRestaurantLowStock } from "../restaurant/restaurant.service";
import { calculateRoomCharge } from "../rooms/rooms.service";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function canSee(role: StaffRole, module: StaffRole) {
  return role === "MANAGEMENT" || role === module;
}

async function roomRevenue(from: Date, to: Date) {
  const bookings = await prisma.booking.findMany({
    where: { checkOutAt: { gte: from, lte: to } },
  });
  return bookings.reduce((sum, b) => sum + calculateRoomCharge(b).roomTotal, 0);
}

// Includes the restaurant's own bar (retail liquor resold from wholesale transfers) —
// that money comes from guests, unlike the liquor store's wholesale value, which doesn't.
async function restaurantRevenue(from: Date, to: Date) {
  const payments = await prisma.payment.findMany({ where: { paidAt: { gte: from, lte: to } } });
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

export async function getSummary(role: StaffRole) {
  const from = startOfDay(new Date());
  const to = new Date();

  const seeRoom = canSee(role, "ROOMS");
  const seeRestaurant = canSee(role, "RESTAURANT");
  const seeLiquor = canSee(role, "LIQUOR");

  const [room, restaurant, liquorWholesaleValue, rooms, liquorLowStock, restaurantLowStock] = await Promise.all([
    seeRoom ? roomRevenue(from, to) : null,
    seeRestaurant ? restaurantRevenue(from, to) : null,
    seeLiquor ? getWholesaleValue(from, to) : null,
    seeRoom ? prisma.room.findMany() : null,
    seeLiquor ? listLowStock() : null,
    seeRestaurant ? listRestaurantLowStock() : null,
  ]);

  const occupancy = rooms
    ? {
        occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
        totalRooms: rooms.length,
        rate: rooms.length > 0 ? (rooms.filter((r) => r.status === "OCCUPIED").length / rooms.length) * 100 : 0,
      }
    : null;

  return {
    date: from.toISOString().slice(0, 10),
    // Guest-facing revenue only. Liquor store wholesale transfers are an internal cost/supply
    // movement, not revenue — the guest-facing sale happens later at the restaurant's bar, and
    // is already counted in `restaurant`. Including both would double-count that money.
    revenue: {
      room,
      restaurant,
      total: role === "MANAGEMENT" ? (room ?? 0) + (restaurant ?? 0) : null,
    },
    occupancy,
    liquor: {
      wholesaleValue: liquorWholesaleValue,
      lowStockCount: liquorLowStock?.length ?? null,
    },
    lowStock: {
      restaurant: restaurantLowStock?.length ?? null,
    },
  };
}

export async function getRevenueByDay(role: StaffRole, fromStr?: string, toStr?: string) {
  const to = toStr ? new Date(toStr) : new Date();
  const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);

  const seeRoom = canSee(role, "ROOMS");
  const seeRestaurant = canSee(role, "RESTAURANT");

  const days: { date: string; room: number | null; restaurant: number | null }[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);

  while (cursor <= end) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);

    const [room, restaurant] = await Promise.all([
      seeRoom ? roomRevenue(dayStart, dayEnd) : null,
      seeRestaurant ? restaurantRevenue(dayStart, dayEnd) : null,
    ]);

    days.push({ date: dayStart.toISOString().slice(0, 10), room, restaurant });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export async function getLowStockReport(role: StaffRole) {
  return {
    liquor: canSee(role, "LIQUOR") ? await listLowStock() : null,
    restaurant: canSee(role, "RESTAURANT") ? await listRestaurantLowStock() : null,
  };
}
