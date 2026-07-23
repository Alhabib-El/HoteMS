import { prisma } from "../../db/client";
import { HttpError } from "../../middleware/errorHandler";

export function listStores() {
  return prisma.liquorStore.findMany({ orderBy: { name: "asc" } });
}

export function createStore(data: { name: string; location?: string }) {
  return prisma.liquorStore.create({ data });
}

export function listProducts(storeId: string) {
  return prisma.liquorProduct.findMany({ where: { storeId }, orderBy: { name: "asc" } });
}

export function createProduct(
  storeId: string,
  data: {
    name: string;
    brand?: string;
    category: "BEER" | "WINE" | "SPIRITS" | "LIQUEUR" | "READY_TO_DRINK" | "NON_ALCOHOLIC";
    unitPrice: number;
    costPrice: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
  }
) {
  return prisma.liquorProduct.create({ data: { storeId, ...data } });
}

export async function setFeatured(productId: string, isFeatured: boolean) {
  const product = await prisma.liquorProduct.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, "Product not found");
  return prisma.liquorProduct.update({ where: { id: productId }, data: { isFeatured } });
}

export function listTransfers(storeId: string) {
  return prisma.liquorTransfer.findMany({
    where: { storeId },
    include: { product: true, staff: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// The only way a liquor store's stock leaves the building: a wholesale shipment to the
// restaurant's bar. The restaurant then resells it to guests at its own retail price.
export async function transferToRestaurant(
  storeId: string,
  productId: string,
  data: { quantity: number; retailPrice?: number; staffId: string }
) {
  if (data.quantity <= 0) throw new HttpError(400, "Quantity must be greater than zero");

  const product = await prisma.liquorProduct.findUnique({ where: { id: productId } });
  if (!product || product.storeId !== storeId) throw new HttpError(404, "Product not found");
  if (product.stockQuantity < data.quantity) throw new HttpError(409, "Insufficient stock");

  const existingMenuItem = await prisma.menuItem.findUnique({ where: { sourceLiquorProductId: productId } });
  if (!existingMenuItem && !data.retailPrice) {
    throw new HttpError(400, "Retail price is required for the first transfer of this product");
  }

  return prisma.$transaction(async (tx) => {
    await tx.liquorProduct.update({
      where: { id: productId },
      data: { stockQuantity: { decrement: data.quantity } },
    });
    await tx.stockAdjustment.create({
      data: { productId, quantityChange: -data.quantity, reason: "Transferred to restaurant bar" },
    });

    let barCategory = await tx.menuCategory.findFirst({ where: { name: "Bar" } });
    if (!barCategory) {
      barCategory = await tx.menuCategory.create({ data: { name: "Bar" } });
    }

    const menuItem = existingMenuItem
      ? await tx.menuItem.update({
          where: { id: existingMenuItem.id },
          data: {
            stockQuantity: { increment: data.quantity },
            ...(data.retailPrice ? { price: data.retailPrice } : {}),
          },
        })
      : await tx.menuItem.create({
          data: {
            name: product.name,
            categoryId: barCategory.id,
            price: data.retailPrice!,
            stockQuantity: data.quantity,
            lowStockThreshold: product.lowStockThreshold,
            sourceLiquorProductId: productId,
          },
        });

    await tx.liquorTransfer.create({
      data: {
        storeId,
        productId,
        quantity: data.quantity,
        wholesalePrice: product.unitPrice,
        retailPrice: menuItem.price,
        staffId: data.staffId,
      },
    });

    return menuItem;
  });
}

export async function adjustStock(productId: string, data: { quantityChange: number; reason: string }) {
  const product = await prisma.liquorProduct.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, "Product not found");
  if (product.stockQuantity + data.quantityChange < 0) throw new HttpError(409, "Resulting stock cannot be negative");

  return prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.create({ data: { productId, ...data } });
    return tx.liquorProduct.update({
      where: { id: productId },
      data: { stockQuantity: { increment: data.quantityChange } },
    });
  });
}

export async function listLowStock() {
  const products = await prisma.liquorProduct.findMany({
    include: { store: true },
    orderBy: { stockQuantity: "asc" },
  });
  return products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
}

export async function getWholesaleValue(from: Date, to: Date) {
  const transfers = await prisma.liquorTransfer.findMany({ where: { createdAt: { gte: from, lte: to } } });
  return transfers.reduce((sum, t) => sum + Number(t.wholesalePrice) * t.quantity, 0);
}
