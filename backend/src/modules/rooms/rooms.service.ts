import { prisma } from "../../db/client";
import { HttpError } from "../../middleware/errorHandler";

export function listRoomTypes() {
  return prisma.roomType.findMany({ orderBy: { name: "asc" } });
}

export function createRoomType(data: {
  name: string;
  basePrice: number;
  capacity: number;
  description?: string;
}) {
  return prisma.roomType.create({ data });
}

export function listRooms() {
  return prisma.room.findMany({
    include: {
      roomType: true,
      bookings: {
        where: { status: "CHECKED_IN" },
        include: { guest: true },
      },
    },
    orderBy: { number: "asc" },
  });
}

export function createRoom(data: { number: string; keyNumber: string; floor: number; roomTypeId: string }) {
  return prisma.room.create({ data });
}

export function listBookings(activeOnly: boolean) {
  return prisma.booking.findMany({
    where: activeOnly ? { status: "CHECKED_IN" } : undefined,
    include: { guest: true, room: { include: { roomType: true } } },
    orderBy: { checkInAt: "desc" },
  });
}

export async function checkIn(data: {
  roomId: string;
  guest: { fullName: string; phone?: string; email?: string; idNumber?: string };
  expectedCheckOutAt: string;
  ratePerNight: number;
  isShortStay?: boolean;
  notes?: string;
}) {
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) throw new HttpError(404, "Room not found");
  if (room.status !== "AVAILABLE") throw new HttpError(409, "Room is not available");

  return prisma.$transaction(async (tx) => {
    const guest = await tx.guest.create({ data: data.guest });
    const booking = await tx.booking.create({
      data: {
        roomId: data.roomId,
        guestId: guest.id,
        expectedCheckOutAt: new Date(data.expectedCheckOutAt),
        ratePerNight: data.ratePerNight,
        isShortStay: data.isShortStay ?? false,
        notes: data.notes,
      },
      include: { guest: true, room: { include: { roomType: true } } },
    });
    await tx.room.update({ where: { id: data.roomId }, data: { status: "OCCUPIED" } });
    return booking;
  });
}

// isShortStay bookings charge a flat rate instead of nights x ratePerNight; shared with reporting revenue math.
export function calculateRoomCharge(booking: {
  checkInAt: Date;
  checkOutAt: Date | null;
  ratePerNight: unknown;
  isShortStay: boolean;
}) {
  const nights = Math.max(
    1,
    Math.ceil(
      ((booking.checkOutAt ?? new Date()).getTime() - booking.checkInAt.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const roomTotal = booking.isShortStay ? Number(booking.ratePerNight) : nights * Number(booking.ratePerNight);
  return { nights, roomTotal };
}

export async function getFolio(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      folioCharges: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) throw new HttpError(404, "Booking not found");

  const { nights, roomTotal } = calculateRoomCharge(booking);
  const chargesTotal = booking.folioCharges.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    booking,
    nights,
    roomTotal,
    chargesTotal,
    grandTotal: roomTotal + chargesTotal,
  };
}

export async function addFolioCharge(
  bookingId: string,
  data: { sourceModule: "ROOM" | "RESTAURANT"; description: string; amount: number }
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new HttpError(404, "Booking not found");
  if (booking.status !== "CHECKED_IN") throw new HttpError(409, "Booking is not active");

  return prisma.folioCharge.create({
    data: { bookingId, ...data },
  });
}

export async function checkOut(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new HttpError(404, "Booking not found");
  if (booking.status !== "CHECKED_IN") throw new HttpError(409, "Booking is not active");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_OUT", checkOutAt: new Date() },
      include: { guest: true, room: { include: { roomType: true } }, folioCharges: true },
    });
    await tx.room.update({ where: { id: booking.roomId }, data: { status: "CLEANING", housekeeping: "NOT_CLEAN" } });
    return updated;
  });
}

export async function setRoomStatus(roomId: string, status: "AVAILABLE" | "CLEANING" | "MAINTENANCE") {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new HttpError(404, "Room not found");
  if (room.status === "OCCUPIED") throw new HttpError(409, "Cannot change status of an occupied room");
  return prisma.room.update({ where: { id: roomId }, data: { status } });
}

export async function setHousekeeping(
  roomId: string,
  housekeeping: "CLEAN" | "NOT_CLEAN" | "IN_PROGRESS" | "REPAIR",
  staffId?: string
) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new HttpError(404, "Room not found");
  if (room.status === "OCCUPIED") throw new HttpError(409, "Cannot update housekeeping while room is occupied");

  // Marking a room clean returns it to the available pool; marking it in need of repair
  // takes it out of service — both flow back into the occupancy status automatically.
  let status = room.status;
  if (housekeeping === "CLEAN") status = "AVAILABLE";
  if (housekeeping === "REPAIR") status = "MAINTENANCE";

  const justCleaned = housekeeping === "CLEAN" && room.housekeeping !== "CLEAN";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.room.update({ where: { id: roomId }, data: { housekeeping, status } });

    // Turning a room over consumes its room type's par-level supplies from the central store.
    if (justCleaned) {
      const requirements = await tx.roomSupplyRequirement.findMany({
        where: { roomTypeId: room.roomTypeId },
        include: { supplyItem: true },
      });
      for (const req of requirements) {
        const consumed = Math.min(req.quantityPerClean, req.supplyItem.stockQuantity);
        if (consumed <= 0) continue;
        await tx.roomSupplyItem.update({
          where: { id: req.supplyItemId },
          data: { stockQuantity: { decrement: consumed } },
        });
        await tx.roomSupplyAdjustment.create({
          data: {
            supplyItemId: req.supplyItemId,
            quantityChange: -consumed,
            reason: `Room turnover: Room ${room.number}`,
            roomId: room.id,
            staffId,
          },
        });
      }
    }

    return updated;
  });
}

export function listSupplyItems() {
  return prisma.roomSupplyItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export function createSupplyItem(data: {
  name: string;
  category: "LINEN" | "TOILETRIES" | "AMENITIES" | "CLEANING";
  unit: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  costPrice?: number;
}) {
  return prisma.roomSupplyItem.create({ data });
}

export async function adjustSupplyStock(
  supplyItemId: string,
  data: { quantityChange: number; reason: string; staffId?: string }
) {
  const item = await prisma.roomSupplyItem.findUnique({ where: { id: supplyItemId } });
  if (!item) throw new HttpError(404, "Supply item not found");
  if (item.stockQuantity + data.quantityChange < 0) throw new HttpError(409, "Resulting stock cannot be negative");

  return prisma.$transaction(async (tx) => {
    await tx.roomSupplyAdjustment.create({
      data: {
        supplyItemId,
        quantityChange: data.quantityChange,
        reason: data.reason,
        staffId: data.staffId,
      },
    });
    return tx.roomSupplyItem.update({
      where: { id: supplyItemId },
      data: { stockQuantity: { increment: data.quantityChange } },
    });
  });
}

export async function listLowStockSupplies() {
  const items = await prisma.roomSupplyItem.findMany({ orderBy: { stockQuantity: "asc" } });
  return items.filter((i) => i.stockQuantity <= i.lowStockThreshold);
}

export function listSupplyRequirements() {
  return prisma.roomSupplyRequirement.findMany({
    include: { roomType: true, supplyItem: true },
    orderBy: [{ roomType: { name: "asc" } }, { supplyItem: { name: "asc" } }],
  });
}

export function upsertSupplyRequirement(data: { roomTypeId: string; supplyItemId: string; quantityPerClean: number }) {
  return prisma.roomSupplyRequirement.upsert({
    where: { roomTypeId_supplyItemId: { roomTypeId: data.roomTypeId, supplyItemId: data.supplyItemId } },
    create: data,
    update: { quantityPerClean: data.quantityPerClean },
    include: { roomType: true, supplyItem: true },
  });
}

export function deleteSupplyRequirement(id: string) {
  return prisma.roomSupplyRequirement.delete({ where: { id } });
}
