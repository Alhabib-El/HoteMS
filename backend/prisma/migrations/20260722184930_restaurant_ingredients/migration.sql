-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('PROTEIN', 'PRODUCE', 'DAIRY', 'PANTRY', 'BEVERAGE', 'FROZEN', 'BAKERY');

-- CreateTable
CREATE TABLE "RestaurantIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "stockQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "lowStockThreshold" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "costPerUnit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "supplier" TEXT,

    CONSTRAINT "RestaurantIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemIngredient" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityPerServing" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "MenuItemIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientAdjustment" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityChange" DECIMAL(10,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemIngredient_menuItemId_ingredientId_key" ON "MenuItemIngredient"("menuItemId", "ingredientId");

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemIngredient" ADD CONSTRAINT "MenuItemIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "RestaurantIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientAdjustment" ADD CONSTRAINT "IngredientAdjustment_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "RestaurantIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientAdjustment" ADD CONSTRAINT "IngredientAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientAdjustment" ADD CONSTRAINT "IngredientAdjustment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
