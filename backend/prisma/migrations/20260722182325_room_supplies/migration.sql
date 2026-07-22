-- CreateEnum
CREATE TYPE "RoomSupplyCategory" AS ENUM ('LINEN', 'TOILETRIES', 'AMENITIES', 'CLEANING');

-- CreateTable
CREATE TABLE "RoomSupplyItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "RoomSupplyCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "RoomSupplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSupplyRequirement" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "quantityPerClean" INTEGER NOT NULL,

    CONSTRAINT "RoomSupplyRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSupplyAdjustment" (
    "id" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "roomId" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomSupplyAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomSupplyRequirement_roomTypeId_supplyItemId_key" ON "RoomSupplyRequirement"("roomTypeId", "supplyItemId");

-- AddForeignKey
ALTER TABLE "RoomSupplyRequirement" ADD CONSTRAINT "RoomSupplyRequirement_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSupplyRequirement" ADD CONSTRAINT "RoomSupplyRequirement_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "RoomSupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSupplyAdjustment" ADD CONSTRAINT "RoomSupplyAdjustment_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "RoomSupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSupplyAdjustment" ADD CONSTRAINT "RoomSupplyAdjustment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSupplyAdjustment" ADD CONSTRAINT "RoomSupplyAdjustment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
