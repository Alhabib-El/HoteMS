import { apiClient } from "../../shared/api/client";

export interface LiquorStore {
  id: string;
  name: string;
  location?: string | null;
}

export interface LiquorProduct {
  id: string;
  storeId: string;
  name: string;
  category?: string | null;
  unitPrice: string;
  costPrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface LiquorTransfer {
  id: string;
  storeId: string;
  productId: string;
  product: LiquorProduct;
  quantity: number;
  wholesalePrice: string;
  retailPrice: string;
  staff: { id: string; fullName: string };
  createdAt: string;
}

export const liquorApi = {
  listStores: () => apiClient.get<LiquorStore[]>("/liquor/stores").then((r) => r.data),
  createStore: (data: { name: string; location?: string }) =>
    apiClient.post<LiquorStore>("/liquor/stores", data).then((r) => r.data),

  listProducts: (storeId: string) =>
    apiClient.get<LiquorProduct[]>(`/liquor/stores/${storeId}/products`).then((r) => r.data),
  createProduct: (
    storeId: string,
    data: { name: string; category?: string; unitPrice: number; costPrice: number; stockQuantity?: number; lowStockThreshold?: number }
  ) => apiClient.post<LiquorProduct>(`/liquor/stores/${storeId}/products`, data).then((r) => r.data),

  adjustStock: (productId: string, data: { quantityChange: number; reason: string }) =>
    apiClient.post<LiquorProduct>(`/liquor/products/${productId}/stock-adjustments`, data).then((r) => r.data),
  listLowStock: () => apiClient.get<(LiquorProduct & { store: LiquorStore })[]>("/liquor/low-stock").then((r) => r.data),

  transferToRestaurant: (storeId: string, productId: string, data: { quantity: number; retailPrice?: number }) =>
    apiClient.post(`/liquor/stores/${storeId}/products/${productId}/transfer`, data).then((r) => r.data),
  listTransfers: (storeId: string) =>
    apiClient.get<LiquorTransfer[]>(`/liquor/stores/${storeId}/transfers`).then((r) => r.data),
};
