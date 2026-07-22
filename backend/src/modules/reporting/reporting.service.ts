import { StaffRole } from "@prisma/client";
import { prisma } from "../../db/client";
import { getWholesaleValue, listLowStock } from "../liquor/liquor.service";
import { listLowStockIngredients, listRestaurantLowStock } from "../restaurant/restaurant.service";
import { calculateRoomCharge, listLowStockSupplies } from "../rooms/rooms.service";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function canSee(role: StaffRole, module: StaffRole) {
  return role === "MANAGEMENT" || role === module;
}

// Shared default: last 7 days ending today, inclusive, when no explicit range is given.
function resolveRange(fromStr?: string, toStr?: string) {
  const to = toStr ? new Date(toStr) : new Date();
  const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);
  const dayEnd = new Date(to);
  dayEnd.setHours(23, 59, 59, 999);
  return { from, to, dayEnd };
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

  const [room, restaurant, liquorWholesaleValue, rooms, liquorLowStock, restaurantLowStock, roomSupplyLowStock, ingredientLowStock] =
    await Promise.all([
      seeRoom ? roomRevenue(from, to) : null,
      seeRestaurant ? restaurantRevenue(from, to) : null,
      seeLiquor ? getWholesaleValue(from, to) : null,
      seeRoom ? prisma.room.findMany() : null,
      seeLiquor ? listLowStock() : null,
      seeRestaurant ? listRestaurantLowStock() : null,
      seeRoom ? listLowStockSupplies() : null,
      seeRestaurant ? listLowStockIngredients() : null,
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
      roomSupplies: roomSupplyLowStock?.length ?? null,
      ingredients: ingredientLowStock?.length ?? null,
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
    roomSupplies: canSee(role, "ROOMS") ? await listLowStockSupplies() : null,
    ingredients: canSee(role, "RESTAURANT") ? await listLowStockIngredients() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Detailed, date-range reports. Each of these is gated by requireRole at the
// router level (module role, or Management), so — unlike getSummary/getRevenueByDay/
// getLowStockReport above, which are shared across all roles and self-scope — these
// don't need to take a `role` param or filter their own output.
// ─────────────────────────────────────────────────────────────────────────

// Daily occupancy computed from booking stay periods that overlap each day, not live
// room status — so it works retroactively over any date range, not just "right now".
async function occupancyTrendSeries(from: Date, to: Date) {
  const totalRooms = await prisma.room.count();
  const dayEnd = new Date(to);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: "CANCELLED" },
      checkInAt: { lte: dayEnd },
      OR: [{ checkOutAt: null }, { checkOutAt: { gte: from } }],
    },
    select: { roomId: true, checkInAt: true, checkOutAt: true },
  });

  const days: { date: string; occupied: number; totalRooms: number; rate: number }[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);

  while (cursor <= end) {
    const dayStart = new Date(cursor);
    const dayEndLoop = new Date(cursor);
    dayEndLoop.setHours(23, 59, 59, 999);

    const occupiedRoomIds = new Set(
      bookings
        .filter((b) => b.checkInAt <= dayEndLoop && (b.checkOutAt === null || b.checkOutAt >= dayStart))
        .map((b) => b.roomId)
    );
    const rate = totalRooms > 0 ? (occupiedRoomIds.size / totalRooms) * 100 : 0;
    days.push({ date: dayStart.toISOString().slice(0, 10), occupied: occupiedRoomIds.size, totalRooms, rate });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function getOccupancyTrend(fromStr?: string, toStr?: string) {
  const { from, to } = resolveRange(fromStr, toStr);
  return occupancyTrendSeries(from, to);
}

// Industry-standard hotel KPIs: ADR (Average Daily Rate = room revenue / room-nights
// sold) and RevPAR (Revenue Per Available Room = room revenue / (rooms x days)).
export async function getKpis(role: StaffRole, fromStr?: string, toStr?: string) {
  const { from, to, dayEnd } = resolveRange(fromStr, toStr);
  const days = Math.max(1, Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const seeRoom = canSee(role, "ROOMS");
  const seeRestaurant = canSee(role, "RESTAURANT");

  const [room, restaurant, totalRooms, bookingsCheckedOut, occupancySeries] = await Promise.all([
    seeRoom ? roomRevenue(from, dayEnd) : null,
    seeRestaurant ? restaurantRevenue(from, dayEnd) : null,
    seeRoom ? prisma.room.count() : null,
    seeRoom ? prisma.booking.findMany({ where: { checkOutAt: { gte: from, lte: dayEnd } } }) : null,
    seeRoom ? occupancyTrendSeries(from, to) : null,
  ]);

  let adr: number | null = null;
  let revPar: number | null = null;
  let avgOccupancy: number | null = null;

  if (seeRoom && bookingsCheckedOut && totalRooms !== null && room !== null) {
    const roomNights = bookingsCheckedOut.reduce((sum, b) => sum + calculateRoomCharge(b).nights, 0);
    adr = roomNights > 0 ? room / roomNights : 0;
    revPar = totalRooms > 0 ? room / (totalRooms * days) : 0;
  }
  if (occupancySeries) {
    avgOccupancy = occupancySeries.reduce((sum, d) => sum + d.rate, 0) / occupancySeries.length;
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    revenue: { room, restaurant, total: role === "MANAGEMENT" ? (room ?? 0) + (restaurant ?? 0) : null },
    adr,
    revPar,
    avgOccupancy,
  };
}

export async function getArrivalsDepartures(fromStr?: string, toStr?: string) {
  const { from, dayEnd } = resolveRange(fromStr, toStr);

  const [arrivals, departures] = await Promise.all([
    prisma.booking.findMany({
      where: { checkInAt: { gte: from, lte: dayEnd } },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkInAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { checkOutAt: { gte: from, lte: dayEnd } },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { checkOutAt: "asc" },
    }),
  ]);

  const avgLengthOfStay =
    departures.length > 0
      ? departures.reduce((sum, b) => sum + calculateRoomCharge(b).nights, 0) / departures.length
      : 0;
  const shortStayCount = departures.filter((b) => b.isShortStay).length;

  return {
    arrivals,
    departures,
    avgLengthOfStay,
    shortStayCount,
    overnightCount: departures.length - shortStayCount,
  };
}

export async function getRestaurantSalesReport(fromStr?: string, toStr?: string) {
  const { from, dayEnd } = resolveRange(fromStr, toStr);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", closedAt: { gte: from, lte: dayEnd } },
    include: { items: { include: { menuItem: { include: { category: true } } } }, payments: true },
  });

  const salesByCategory = new Map<string, number>();
  const salesByItem = new Map<string, { name: string; quantity: number; revenue: number }>();
  const paymentsByMethod = new Map<string, number>();
  let totalRevenue = 0;

  for (const order of orders) {
    for (const item of order.items) {
      if (item.voided) continue;
      const lineTotal = Number(item.unitPrice) * item.quantity;
      totalRevenue += lineTotal;

      const catName = item.menuItem.category.name;
      salesByCategory.set(catName, (salesByCategory.get(catName) ?? 0) + lineTotal);

      const existing = salesByItem.get(item.menuItemId) ?? { name: item.menuItem.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += lineTotal;
      salesByItem.set(item.menuItemId, existing);
    }
    for (const p of order.payments) {
      paymentsByMethod.set(p.method, (paymentsByMethod.get(p.method) ?? 0) + Number(p.amount));
    }
  }

  const topItems = Array.from(salesByItem.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalRevenue,
    orderCount: orders.length,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    salesByCategory: Array.from(salesByCategory.entries()).map(([category, revenue]) => ({ category, revenue })),
    topItems,
    paymentsByMethod: Array.from(paymentsByMethod.entries()).map(([method, amount]) => ({ method, amount })),
  };
}

export async function getVoidReport(fromStr?: string, toStr?: string) {
  const { from, dayEnd } = resolveRange(fromStr, toStr);

  const items = await prisma.orderItem.findMany({
    where: { voided: true, voidedAt: { gte: from, lte: dayEnd } },
    include: { menuItem: true, order: { select: { id: true, tableId: true } } },
    orderBy: { voidedAt: "desc" },
  });

  return {
    items,
    count: items.length,
    totalValueVoided: items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
  };
}

export async function getLiquorReport(fromStr?: string, toStr?: string) {
  const { from, dayEnd } = resolveRange(fromStr, toStr);

  const [transfers, stores] = await Promise.all([
    prisma.liquorTransfer.findMany({
      where: { createdAt: { gte: from, lte: dayEnd } },
      include: { store: true, product: true, staff: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.liquorStore.findMany({ include: { products: true } }),
  ]);

  const stockValuation = stores.map((s) => ({
    storeId: s.id,
    storeName: s.name,
    valuationAtCost: s.products.reduce((sum, p) => sum + Number(p.costPrice) * p.stockQuantity, 0),
    valuationAtWholesale: s.products.reduce((sum, p) => sum + Number(p.unitPrice) * p.stockQuantity, 0),
  }));

  return {
    transfers,
    totalWholesaleValue: transfers.reduce((sum, t) => sum + Number(t.wholesalePrice) * t.quantity, 0),
    totalRetailValue: transfers.reduce((sum, t) => sum + Number(t.retailPrice) * t.quantity, 0),
    stockValuation,
  };
}

export async function getLaborReport(fromStr?: string, toStr?: string) {
  const { from, dayEnd } = resolveRange(fromStr, toStr);

  const records = await prisma.attendanceRecord.findMany({
    where: { clockInAt: { gte: from, lte: dayEnd } },
    include: { staff: { select: { id: true, fullName: true, role: true } } },
  });

  const hoursByStaff = new Map<string, { staffId: string; fullName: string; role: StaffRole; hours: number }>();
  for (const r of records) {
    if (!r.clockOutAt) continue;
    const hours = (r.clockOutAt.getTime() - r.clockInAt.getTime()) / (1000 * 60 * 60);
    const existing = hoursByStaff.get(r.staffId) ?? {
      staffId: r.staffId,
      fullName: r.staff.fullName,
      role: r.staff.role,
      hours: 0,
    };
    existing.hours += hours;
    hoursByStaff.set(r.staffId, existing);
  }
  const staffHours = Array.from(hoursByStaff.values()).sort((a, b) => b.hours - a.hours);

  const upcomingLeave = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED", startDate: { gte: startOfDay(new Date()) } },
    include: { staff: { select: { id: true, fullName: true } } },
    orderBy: { startDate: "asc" },
    take: 10,
  });

  return {
    staffHours,
    totalHours: staffHours.reduce((sum, s) => sum + s.hours, 0),
    openShiftsCount: records.filter((r) => !r.clockOutAt).length,
    upcomingLeave,
  };
}

export async function getRevenueCsv(fromStr?: string, toStr?: string) {
  const days = await getRevenueByDay("MANAGEMENT", fromStr, toStr);
  const header = "Date,Room Revenue (KES),Restaurant Revenue (KES),Total (KES)\n";
  const rows = days
    .map((d) => {
      const room = d.room ?? 0;
      const restaurant = d.restaurant ?? 0;
      return `${d.date},${room.toFixed(2)},${restaurant.toFixed(2)},${(room + restaurant).toFixed(2)}`;
    })
    .join("\n");
  return header + rows + "\n";
}
