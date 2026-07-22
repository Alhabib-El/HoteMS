import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const staffSeed = [
  {
    fullName: "Grace Kariuki",
    role: "MANAGEMENT" as const,
    pin: "123456",
    employeeNumber: "EMP-0001",
    jobTitle: "General Manager",
    phone: "+254712000001",
    email: "grace.kariuki@hotems.co.ke",
    dateOfBirth: "1985-03-14",
    nationalId: "23456781",
    dateHired: "2019-01-06",
    employmentType: "FULL_TIME" as const,
    baseSalary: 180000,
    annualLeaveDays: 24,
    emergencyContactName: "Peter Kariuki",
    emergencyContactPhone: "+254722000001",
    emergencyContactRelation: "Spouse",
  },
  {
    fullName: "Brian Otieno",
    role: "ROOMS" as const,
    pin: "234567",
    employeeNumber: "EMP-0002",
    jobTitle: "Front Office Supervisor",
    phone: "+254712000002",
    email: "brian.otieno@hotems.co.ke",
    dateOfBirth: "1992-07-22",
    nationalId: "27654321",
    dateHired: "2021-04-12",
    employmentType: "FULL_TIME" as const,
    baseSalary: 65000,
    annualLeaveDays: 21,
    emergencyContactName: "Mary Otieno",
    emergencyContactPhone: "+254722000002",
    emergencyContactRelation: "Sister",
  },
  {
    fullName: "Kevin Mwangi",
    role: "LIQUOR" as const,
    pin: "345678",
    employeeNumber: "EMP-0003",
    jobTitle: "Liquor Store Attendant",
    phone: "+254712000003",
    email: "kevin.mwangi@hotems.co.ke",
    dateOfBirth: "1995-11-02",
    nationalId: "29876543",
    dateHired: "2022-09-01",
    employmentType: "FULL_TIME" as const,
    baseSalary: 45000,
    annualLeaveDays: 21,
    emergencyContactName: "Alice Mwangi",
    emergencyContactPhone: "+254722000003",
    emergencyContactRelation: "Mother",
  },
  {
    fullName: "Faith Wanjiru",
    role: "RESTAURANT" as const,
    pin: "456789",
    employeeNumber: "EMP-0004",
    jobTitle: "Head Waitress",
    phone: "+254712000004",
    email: "faith.wanjiru@hotems.co.ke",
    dateOfBirth: "1998-05-30",
    nationalId: "31234567",
    dateHired: "2023-02-20",
    employmentType: "FULL_TIME" as const,
    baseSalary: 42000,
    annualLeaveDays: 21,
    emergencyContactName: "John Wanjiru",
    emergencyContactPhone: "+254722000004",
    emergencyContactRelation: "Father",
  },
];

async function main() {
  const staffByName = new Map<string, { id: string }>();
  for (const s of staffSeed) {
    const { pin, fullName, role, ...profile } = s;
    const staff = await prisma.staff.create({
      data: {
        fullName,
        role,
        pinHash: await bcrypt.hash(pin, 10),
        ...profile,
        dateOfBirth: new Date(profile.dateOfBirth),
        dateHired: new Date(profile.dateHired),
      },
    });
    staffByName.set(fullName, staff);
  }

  // A week's roster so the schedule/roster view has something to show, plus a couple of
  // attendance records and a pending leave request to demo the workflow end to end.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const shiftPattern: { name: string; shiftType: "MORNING" | "AFTERNOON" | "NIGHT" }[] = [
    { name: "Brian Otieno", shiftType: "MORNING" },
    { name: "Kevin Mwangi", shiftType: "AFTERNOON" },
    { name: "Faith Wanjiru", shiftType: "MORNING" },
  ];
  for (let dayOffset = -2; dayOffset <= 4; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    for (const s of shiftPattern) {
      await prisma.staffShift.create({
        data: { staffId: staffByName.get(s.name)!.id, date, shiftType: s.shiftType },
      });
    }
  }

  function atTime(date: Date, hours: number, minutes: number) {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.attendanceRecord.create({
    data: {
      staffId: staffByName.get("Brian Otieno")!.id,
      clockInAt: atTime(yesterday, 7, 55),
      clockOutAt: atTime(yesterday, 16, 5),
    },
  });
  await prisma.attendanceRecord.create({
    data: { staffId: staffByName.get("Faith Wanjiru")!.id, clockInAt: atTime(today, 6, 50) },
  });

  const leaveStart = new Date(today);
  leaveStart.setDate(leaveStart.getDate() + 10);
  const leaveEnd = new Date(leaveStart);
  leaveEnd.setDate(leaveEnd.getDate() + 4);
  await prisma.leaveRequest.create({
    data: {
      staffId: staffByName.get("Kevin Mwangi")!.id,
      leaveType: "ANNUAL",
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: "Family visit upcountry",
    },
  });

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

  // Room supplies: housekeeping's central store (linen, toiletries, guest amenities, cart
  // chemicals). Par levels below define how many units each room type consumes per turnover;
  // CLEANING-category items have no par level since they're drawn across many rooms, not
  // consumed 1:1 per clean.
  const supplyCatalog: {
    name: string;
    category: "LINEN" | "TOILETRIES" | "AMENITIES" | "CLEANING";
    unit: string;
    stockQuantity: number;
    lowStockThreshold: number;
    costPrice: number;
  }[] = [
    { name: "Bath Towel", category: "LINEN", unit: "pcs", stockQuantity: 200, lowStockThreshold: 40, costPrice: 800 },
    { name: "Hand Towel", category: "LINEN", unit: "pcs", stockQuantity: 200, lowStockThreshold: 40, costPrice: 400 },
    { name: "Face Towel", category: "LINEN", unit: "pcs", stockQuantity: 200, lowStockThreshold: 40, costPrice: 250 },
    { name: "Bath Mat", category: "LINEN", unit: "pcs", stockQuantity: 100, lowStockThreshold: 20, costPrice: 600 },
    { name: "Bedsheet (Fitted)", category: "LINEN", unit: "pcs", stockQuantity: 100, lowStockThreshold: 20, costPrice: 1200 },
    { name: "Bedsheet (Flat)", category: "LINEN", unit: "pcs", stockQuantity: 100, lowStockThreshold: 20, costPrice: 1200 },
    { name: "Pillowcase", category: "LINEN", unit: "pcs", stockQuantity: 200, lowStockThreshold: 40, costPrice: 350 },
    { name: "Duvet Cover", category: "LINEN", unit: "pcs", stockQuantity: 80, lowStockThreshold: 15, costPrice: 1800 },
    { name: "Bar Soap", category: "TOILETRIES", unit: "pcs", stockQuantity: 500, lowStockThreshold: 100, costPrice: 60 },
    { name: "Shampoo Sachet", category: "TOILETRIES", unit: "pcs", stockQuantity: 500, lowStockThreshold: 100, costPrice: 40 },
    { name: "Conditioner Sachet", category: "TOILETRIES", unit: "pcs", stockQuantity: 300, lowStockThreshold: 60, costPrice: 40 },
    { name: "Body Lotion Sachet", category: "TOILETRIES", unit: "pcs", stockQuantity: 300, lowStockThreshold: 60, costPrice: 45 },
    { name: "Toilet Paper Roll", category: "TOILETRIES", unit: "roll", stockQuantity: 400, lowStockThreshold: 80, costPrice: 80 },
    { name: "Facial Tissue Box", category: "TOILETRIES", unit: "box", stockQuantity: 150, lowStockThreshold: 30, costPrice: 150 },
    { name: "Drinking Water Bottle", category: "AMENITIES", unit: "bottle", stockQuantity: 400, lowStockThreshold: 80, costPrice: 50 },
    { name: "Slippers", category: "AMENITIES", unit: "pair", stockQuantity: 150, lowStockThreshold: 30, costPrice: 150 },
    { name: "Coffee & Tea Sachet Set", category: "AMENITIES", unit: "set", stockQuantity: 300, lowStockThreshold: 60, costPrice: 100 },
    { name: "Notepad & Pen Set", category: "AMENITIES", unit: "set", stockQuantity: 200, lowStockThreshold: 40, costPrice: 70 },
    { name: "Laundry Bag", category: "AMENITIES", unit: "pcs", stockQuantity: 150, lowStockThreshold: 30, costPrice: 90 },
    { name: "Bathrobe", category: "AMENITIES", unit: "pcs", stockQuantity: 20, lowStockThreshold: 5, costPrice: 2500 },
    { name: "All-Purpose Cleaner", category: "CLEANING", unit: "bottle", stockQuantity: 40, lowStockThreshold: 10, costPrice: 350 },
    { name: "Trash Bags", category: "CLEANING", unit: "pack", stockQuantity: 60, lowStockThreshold: 15, costPrice: 250 },
    { name: "Air Freshener", category: "CLEANING", unit: "bottle", stockQuantity: 40, lowStockThreshold: 10, costPrice: 300 },
  ];
  const supplyItems = new Map<string, { id: string }>();
  for (const s of supplyCatalog) supplyItems.set(s.name, await prisma.roomSupplyItem.create({ data: s }));

  // Par levels per room type (units consumed per clean). Omitted pairs mean "not stocked
  // for that tier" (e.g. only Deluxe/Suite get slippers, only Suite gets bathrobes).
  const parLevels: { name: string; standard?: number; deluxe?: number; suite?: number }[] = [
    { name: "Bath Towel", standard: 2, deluxe: 2, suite: 4 },
    { name: "Hand Towel", standard: 1, deluxe: 2, suite: 2 },
    { name: "Face Towel", standard: 1, deluxe: 1, suite: 2 },
    { name: "Bath Mat", standard: 1, deluxe: 1, suite: 1 },
    { name: "Bedsheet (Fitted)", standard: 1, deluxe: 1, suite: 1 },
    { name: "Bedsheet (Flat)", standard: 1, deluxe: 1, suite: 1 },
    { name: "Pillowcase", standard: 2, deluxe: 2, suite: 4 },
    { name: "Duvet Cover", standard: 1, deluxe: 1, suite: 1 },
    { name: "Bar Soap", standard: 1, deluxe: 2, suite: 2 },
    { name: "Shampoo Sachet", standard: 1, deluxe: 1, suite: 2 },
    { name: "Conditioner Sachet", deluxe: 1, suite: 2 },
    { name: "Body Lotion Sachet", deluxe: 1, suite: 2 },
    { name: "Toilet Paper Roll", standard: 2, deluxe: 2, suite: 2 },
    { name: "Facial Tissue Box", standard: 1, deluxe: 1, suite: 1 },
    { name: "Drinking Water Bottle", standard: 2, deluxe: 2, suite: 4 },
    { name: "Slippers", deluxe: 1, suite: 2 },
    { name: "Coffee & Tea Sachet Set", standard: 1, deluxe: 1, suite: 1 },
    { name: "Notepad & Pen Set", standard: 1, deluxe: 1, suite: 1 },
    { name: "Laundry Bag", standard: 1, deluxe: 1, suite: 1 },
    { name: "Bathrobe", suite: 2 },
  ];
  const roomTypeByTier = { standard, deluxe, suite };
  for (const p of parLevels) {
    for (const tier of ["standard", "deluxe", "suite"] as const) {
      const quantityPerClean = p[tier];
      if (!quantityPerClean) continue;
      await prisma.roomSupplyRequirement.create({
        data: {
          roomTypeId: roomTypeByTier[tier].id,
          supplyItemId: supplyItems.get(p.name)!.id,
          quantityPerClean,
        },
      });
    }
  }

  const starters = await prisma.menuCategory.create({ data: { name: "Starters" } });
  const mains = await prisma.menuCategory.create({ data: { name: "Mains" } });
  const drinks = await prisma.menuCategory.create({ data: { name: "Drinks" } });

  const menuItemsData = [
    { name: "Soup of the Day", categoryId: starters.id, price: 800 },
    { name: "Garden Salad", categoryId: starters.id, price: 700 },
    { name: "Grilled Chicken", categoryId: mains.id, price: 1800 },
    { name: "Beef Burger", categoryId: mains.id, price: 1200 },
    { name: "Vegetable Pasta", categoryId: mains.id, price: 1100 },
    { name: "Soft Drink", categoryId: drinks.id, price: 250 },
    { name: "Fresh Juice", categoryId: drinks.id, price: 350 },
  ];
  const menuItems = new Map<string, { id: string }>();
  for (const m of menuItemsData) menuItems.set(m.name, await prisma.menuItem.create({ data: m }));

  // Kitchen ingredient inventory: raw materials the kitchen cooks with, distinct from bar
  // stock. Recipes below define each dish's bill of materials — adding an order item consumes
  // these automatically (and blocks the dish, "86-ing" it, once an ingredient runs out).
  const ingredientCatalog: {
    name: string;
    category: "PROTEIN" | "PRODUCE" | "DAIRY" | "PANTRY" | "BEVERAGE" | "FROZEN" | "BAKERY";
    unit: string;
    stockQuantity: number;
    lowStockThreshold: number;
    costPerUnit: number;
    supplier?: string;
  }[] = [
    { name: "Chicken Breast", category: "PROTEIN", unit: "kg", stockQuantity: 40, lowStockThreshold: 8, costPerUnit: 650, supplier: "Kenchic Suppliers" },
    { name: "Beef Patty", category: "PROTEIN", unit: "kg", stockQuantity: 30, lowStockThreshold: 6, costPerUnit: 800, supplier: "Farmers Choice" },
    { name: "Lettuce", category: "PRODUCE", unit: "kg", stockQuantity: 15, lowStockThreshold: 3, costPerUnit: 150, supplier: "Local Market" },
    { name: "Tomato", category: "PRODUCE", unit: "kg", stockQuantity: 20, lowStockThreshold: 4, costPerUnit: 120, supplier: "Local Market" },
    { name: "Cucumber", category: "PRODUCE", unit: "kg", stockQuantity: 12, lowStockThreshold: 3, costPerUnit: 100, supplier: "Local Market" },
    { name: "Mixed Vegetables", category: "PRODUCE", unit: "kg", stockQuantity: 25, lowStockThreshold: 5, costPerUnit: 180, supplier: "Local Market" },
    { name: "Lemon", category: "PRODUCE", unit: "piece", stockQuantity: 60, lowStockThreshold: 15, costPerUnit: 20, supplier: "Local Market" },
    { name: "Orange", category: "PRODUCE", unit: "kg", stockQuantity: 20, lowStockThreshold: 5, costPerUnit: 150, supplier: "Local Market" },
    { name: "Cheddar Cheese", category: "DAIRY", unit: "kg", stockQuantity: 10, lowStockThreshold: 2, costPerUnit: 900, supplier: "Brookside" },
    { name: "Parmesan Cheese", category: "DAIRY", unit: "kg", stockQuantity: 6, lowStockThreshold: 1.5, costPerUnit: 1400, supplier: "Brookside" },
    { name: "Cream", category: "DAIRY", unit: "liter", stockQuantity: 8, lowStockThreshold: 2, costPerUnit: 400, supplier: "Brookside" },
    { name: "Olive Oil", category: "PANTRY", unit: "liter", stockQuantity: 10, lowStockThreshold: 2, costPerUnit: 600 },
    { name: "Mixed Herbs", category: "PANTRY", unit: "kg", stockQuantity: 3, lowStockThreshold: 0.5, costPerUnit: 1200 },
    { name: "Pasta", category: "PANTRY", unit: "kg", stockQuantity: 25, lowStockThreshold: 5, costPerUnit: 220 },
    { name: "Tomato Sauce", category: "PANTRY", unit: "liter", stockQuantity: 15, lowStockThreshold: 3, costPerUnit: 250 },
    { name: "Vegetable Stock", category: "PANTRY", unit: "liter", stockQuantity: 15, lowStockThreshold: 3, costPerUnit: 150 },
    { name: "Burger Bun", category: "BAKERY", unit: "piece", stockQuantity: 80, lowStockThreshold: 20, costPerUnit: 45 },
  ];
  const ingredients = new Map<string, { id: string }>();
  for (const i of ingredientCatalog) ingredients.set(i.name, await prisma.restaurantIngredient.create({ data: i }));

  const recipes: { menuItem: string; ingredient: string; quantityPerServing: number }[] = [
    { menuItem: "Grilled Chicken", ingredient: "Chicken Breast", quantityPerServing: 0.25 },
    { menuItem: "Grilled Chicken", ingredient: "Olive Oil", quantityPerServing: 0.02 },
    { menuItem: "Grilled Chicken", ingredient: "Mixed Herbs", quantityPerServing: 0.01 },
    { menuItem: "Grilled Chicken", ingredient: "Lemon", quantityPerServing: 0.5 },
    { menuItem: "Beef Burger", ingredient: "Beef Patty", quantityPerServing: 0.15 },
    { menuItem: "Beef Burger", ingredient: "Burger Bun", quantityPerServing: 1 },
    { menuItem: "Beef Burger", ingredient: "Cheddar Cheese", quantityPerServing: 0.03 },
    { menuItem: "Beef Burger", ingredient: "Lettuce", quantityPerServing: 0.02 },
    { menuItem: "Beef Burger", ingredient: "Tomato", quantityPerServing: 0.05 },
    { menuItem: "Vegetable Pasta", ingredient: "Pasta", quantityPerServing: 0.12 },
    { menuItem: "Vegetable Pasta", ingredient: "Mixed Vegetables", quantityPerServing: 0.15 },
    { menuItem: "Vegetable Pasta", ingredient: "Tomato Sauce", quantityPerServing: 0.1 },
    { menuItem: "Vegetable Pasta", ingredient: "Parmesan Cheese", quantityPerServing: 0.02 },
    { menuItem: "Garden Salad", ingredient: "Lettuce", quantityPerServing: 0.08 },
    { menuItem: "Garden Salad", ingredient: "Tomato", quantityPerServing: 0.06 },
    { menuItem: "Garden Salad", ingredient: "Cucumber", quantityPerServing: 0.05 },
    { menuItem: "Garden Salad", ingredient: "Olive Oil", quantityPerServing: 0.01 },
    { menuItem: "Soup of the Day", ingredient: "Mixed Vegetables", quantityPerServing: 0.1 },
    { menuItem: "Soup of the Day", ingredient: "Vegetable Stock", quantityPerServing: 0.3 },
    { menuItem: "Soup of the Day", ingredient: "Cream", quantityPerServing: 0.05 },
    { menuItem: "Fresh Juice", ingredient: "Orange", quantityPerServing: 0.35 },
  ];
  // Soft Drink is a sealed bottled product, not cooked from raw ingredients — left unlimited.
  for (const r of recipes) {
    await prisma.menuItemIngredient.create({
      data: {
        menuItemId: menuItems.get(r.menuItem)!.id,
        ingredientId: ingredients.get(r.ingredient)!.id,
        quantityPerServing: r.quantityPerServing,
      },
    });
  }

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
