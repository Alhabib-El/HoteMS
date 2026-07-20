import { OrderItemPrepStatus } from "@prisma/client";
import { prisma } from "../../db/client";
import { HttpError } from "../../middleware/errorHandler";
import { addFolioCharge } from "../rooms/rooms.service";

export function listCategories() {
  return prisma.menuCategory.findMany({
    include: { items: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export function createCategory(data: { name: string }) {
  return prisma.menuCategory.create({ data });
}

export function createMenuItem(data: {
  name: string;
  categoryId: string;
  price: number;
  isAvailable?: boolean;
}) {
  return prisma.menuItem.create({ data });
}

export function listTables() {
  return prisma.restaurantTable.findMany({ orderBy: { number: "asc" } });
}

export function createTable(data: { number: string; seats: number }) {
  return prisma.restaurantTable.create({ data });
}

export async function listRestaurantLowStock() {
  const items = await prisma.menuItem.findMany({
    where: { stockQuantity: { not: null } },
    include: { category: true },
  });
  return items.filter((i) => i.lowStockThreshold !== null && i.stockQuantity !== null && i.stockQuantity <= i.lowStockThreshold);
}

export function listRestaurantStaff() {
  return prisma.staff.findMany({
    where: { role: "RESTAURANT", active: true },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
}

const orderInclude = {
  table: true,
  assignedStaff: { select: { id: true, fullName: true } },
  items: { include: { menuItem: true } },
  payments: true,
} as const;

export function listOrders(openOnly: boolean) {
  return prisma.order.findMany({
    where: openOnly ? { status: "OPEN" } : undefined,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function openOrder(data: { tableId?: string; bookingId?: string; assignedStaffId?: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { tableId: data.tableId, bookingId: data.bookingId, assignedStaffId: data.assignedStaffId },
      include: orderInclude,
    });
    if (data.tableId) {
      await tx.restaurantTable.update({ where: { id: data.tableId }, data: { status: "OCCUPIED" } });
    }
    return order;
  });
}

export async function linkBooking(orderId: string, bookingId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "OPEN") throw new HttpError(409, "Order is not open");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== "CHECKED_IN") throw new HttpError(400, "Booking is not active");

  return prisma.order.update({
    where: { id: orderId },
    data: { bookingId },
    include: orderInclude,
  });
}

export async function assignStaff(orderId: string, staffId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.active) throw new HttpError(400, "Staff member is not active");

  return prisma.order.update({
    where: { id: orderId },
    data: { assignedStaffId: staffId },
    include: orderInclude,
  });
}

export async function addOrderItem(
  orderId: string,
  data: { menuItemId: string; quantity: number; notes?: string }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "OPEN") throw new HttpError(409, "Order is not open");

  const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menuItemId } });
  if (!menuItem) throw new HttpError(404, "Menu item not found");
  if (menuItem.stockQuantity !== null && menuItem.stockQuantity < data.quantity) {
    throw new HttpError(409, "Insufficient stock");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.create({
      data: {
        orderId,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        unitPrice: menuItem.price,
        notes: data.notes,
      },
    });
    if (menuItem.stockQuantity !== null) {
      await tx.menuItem.update({
        where: { id: data.menuItemId },
        data: { stockQuantity: { decrement: data.quantity } },
      });
    }
    return item;
  });
}

export async function voidOrderItem(orderId: string, itemId: string, data: { reason: string }) {
  const item = await prisma.orderItem.findUnique({ where: { id: itemId }, include: { menuItem: true, order: true } });
  if (!item || item.orderId !== orderId) throw new HttpError(404, "Order item not found");
  if (item.order.status !== "OPEN") throw new HttpError(409, "Order is not open");
  if (item.voided) throw new HttpError(409, "Item is already voided");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.orderItem.update({
      where: { id: itemId },
      data: { voided: true, voidReason: data.reason },
    });
    if (item.menuItem.stockQuantity !== null) {
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
    return updated;
  });
}

export async function updateItemPrepStatus(orderId: string, itemId: string, status: OrderItemPrepStatus) {
  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item || item.orderId !== orderId) throw new HttpError(404, "Order item not found");
  if (item.voided) throw new HttpError(409, "Item is voided");

  return prisma.orderItem.update({ where: { id: itemId }, data: { prepStatus: status } });
}

function orderTotal(items: { unitPrice: unknown; quantity: number; voided: boolean }[]) {
  return items.filter((i) => !i.voided).reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
}

export async function addPayment(orderId: string, data: { amount: number; method: "CASH" | "CARD" | "ROOM_CHARGE" }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true, table: true },
  });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "OPEN") throw new HttpError(409, "Order is not open");
  if (data.amount <= 0) throw new HttpError(400, "Payment amount must be greater than zero");

  const total = orderTotal(order.items);
  const paidSoFar = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.round((total - paidSoFar) * 100) / 100;
  if (remaining <= 0) throw new HttpError(409, "Order is already fully paid");
  if (data.amount > remaining + 0.01) throw new HttpError(400, "Amount exceeds remaining balance");

  if (data.method === "ROOM_CHARGE") {
    if (!order.bookingId) throw new HttpError(400, "Order is not linked to a room booking");
    await addFolioCharge(order.bookingId, {
      sourceModule: "RESTAURANT",
      description: `Restaurant order ${order.id}`,
      amount: data.amount,
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.payment.create({ data: { orderId, amount: data.amount, method: data.method } });
    const nowPaid = paidSoFar + data.amount;
    const fullyPaid = nowPaid >= total - 0.01;

    const updated = await tx.order.update({
      where: { id: orderId },
      data: fullyPaid ? { status: "PAID", closedAt: new Date() } : {},
      include: orderInclude,
    });
    if (fullyPaid && order.tableId) {
      await tx.restaurantTable.update({ where: { id: order.tableId }, data: { status: "FREE" } });
    }
    return updated;
  });
}
