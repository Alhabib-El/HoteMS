import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const staffSeed = [
  { fullName: "Grace Kariuki", role: "MANAGEMENT" as const, pin: "123456" },
  { fullName: "Brian Otieno", role: "ROOMS" as const, pin: "234567" },
  { fullName: "Kevin Mwangi", role: "LIQUOR" as const, pin: "345678" },
  { fullName: "Faith Wanjiru", role: "RESTAURANT" as const, pin: "456789" },
];

async function main() {
  for (const s of staffSeed) {
    await prisma.staff.create({ data: { fullName: s.fullName, role: s.role, pinHash: await bcrypt.hash(s.pin, 10) } });
  }

  const standard = await prisma.roomType.create({
    data: { name: "Standard", basePrice: 6000, capacity: 2, description: "Queen bed, city view" },
  });
  const deluxe = await prisma.roomType.create({
    data: { name: "Deluxe", basePrice: 9500, capacity: 2, description: "King bed, balcony" },
  });
  const suite = await prisma.roomType.create({
    data: { name: "Suite", basePrice: 15000, capacity: 4, description: "Separate living area" },
  });

  const roomsData = [
    { number: "101", keyNumber: "K101", floor: 1, roomTypeId: standard.id },
    { number: "102", keyNumber: "K102", floor: 1, roomTypeId: standard.id, status: "MAINTENANCE" as const, housekeeping: "REPAIR" as const },
    { number: "103", keyNumber: "K103", floor: 1, roomTypeId: standard.id, status: "CLEANING" as const, housekeeping: "IN_PROGRESS" as const },
    { number: "201", keyNumber: "K201", floor: 2, roomTypeId: deluxe.id },
    { number: "202", keyNumber: "K202", floor: 2, roomTypeId: deluxe.id },
    { number: "301", keyNumber: "K301", floor: 3, roomTypeId: suite.id },
  ];
  const rooms = new Map<string, { id: string }>();
  for (const r of roomsData) rooms.set(r.number, await prisma.room.create({ data: r }));

  // A couple of occupied rooms so the room board demos the "guest checked in" card state too.
  const occupiedSeed = [
    { roomNumber: "201", guestName: "Michael Suyama", nights: 2 },
    { roomNumber: "202", guestName: "Nancy Davolio", nights: 4 },
  ];
  for (const o of occupiedSeed) {
    const room = rooms.get(o.roomNumber)!;
    const guest = await prisma.guest.create({ data: { fullName: o.guestName } });
    const roomType = o.roomNumber.startsWith("2") ? deluxe : standard;
    await prisma.booking.create({
      data: {
        roomId: room.id,
        guestId: guest.id,
        expectedCheckOutAt: new Date(Date.now() + o.nights * 24 * 60 * 60 * 1000),
        ratePerNight: roomType.basePrice,
      },
    });
    await prisma.room.update({ where: { id: room.id }, data: { status: "OCCUPIED" } });
  }

  const starters = await prisma.menuCategory.create({ data: { name: "Starters" } });
  const mains = await prisma.menuCategory.create({ data: { name: "Mains" } });
  const drinks = await prisma.menuCategory.create({ data: { name: "Drinks" } });

  await prisma.menuItem.createMany({
    data: [
      { name: "Soup of the Day", categoryId: starters.id, price: 800 },
      { name: "Garden Salad", categoryId: starters.id, price: 700 },
      { name: "Grilled Chicken", categoryId: mains.id, price: 1800 },
      { name: "Beef Burger", categoryId: mains.id, price: 1200 },
      { name: "Vegetable Pasta", categoryId: mains.id, price: 1100 },
      { name: "Soft Drink", categoryId: drinks.id, price: 250 },
      { name: "Fresh Juice", categoryId: drinks.id, price: 350 },
    ],
  });

  for (let i = 1; i <= 6; i++) {
    await prisma.restaurantTable.create({ data: { number: `T${i}`, seats: i % 2 === 0 ? 4 : 2 } });
  }

  // Liquor stores are wholesale suppliers only — they stock bottles/cases and ship them to the
  // restaurant's bar (which then resells to guests at retail). They never sell to guests directly.
  const centralStore = await prisma.liquorStore.create({
    data: { name: "Central Liquor Store", location: "Back-of-house storeroom, ground floor" },
  });
  const warehouseStore = await prisma.liquorStore.create({
    data: { name: "Warehouse Liquor Store", location: "Service block, north wing" },
  });

  await prisma.liquorProduct.createMany({
    data: [
      { storeId: centralStore.id, name: "Local Beer (crate)", category: "Beer", unitPrice: 350, costPrice: 180, stockQuantity: 120, lowStockThreshold: 20 },
      { storeId: centralStore.id, name: "House Red Wine (bottle)", category: "Wine", unitPrice: 1200, costPrice: 500, stockQuantity: 60, lowStockThreshold: 15 },
      { storeId: centralStore.id, name: "Bottled Water (case)", category: "Non-alcoholic", unitPrice: 150, costPrice: 50, stockQuantity: 200, lowStockThreshold: 30 },
      { storeId: warehouseStore.id, name: "Whiskey (bottle)", category: "Spirits", unitPrice: 1000, costPrice: 500, stockQuantity: 40, lowStockThreshold: 10 },
      { storeId: warehouseStore.id, name: "Vodka (bottle)", category: "Spirits", unitPrice: 900, costPrice: 450, stockQuantity: 40, lowStockThreshold: 10 },
      { storeId: warehouseStore.id, name: "Gin (bottle)", category: "Spirits", unitPrice: 950, costPrice: 470, stockQuantity: 40, lowStockThreshold: 10 },
    ],
  });

  console.log("Seed complete. Staff PINs:");
  for (const s of staffSeed) console.log(`  ${s.role.padEnd(10)} ${s.fullName.padEnd(16)} PIN ${s.pin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
