import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { liquorApi } from "../api";

export function StoreInventoryPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["liquor-products", storeId],
    queryFn: () => liquorApi.listProducts(storeId!),
    enabled: !!storeId,
  });

  const { data: transfers } = useQuery({
    queryKey: ["liquor-transfers", storeId],
    queryFn: () => liquorApi.listTransfers(storeId!),
    enabled: !!storeId,
  });

  const [form, setForm] = useState({ name: "", category: "", unitPrice: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 5 });
  const [transferProductId, setTransferProductId] = useState<string | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferRetailPrice, setTransferRetailPrice] = useState(0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["liquor-products", storeId] });
    queryClient.invalidateQueries({ queryKey: ["liquor-transfers", storeId] });
  };

  const createProduct = useMutation({
    mutationFn: () => liquorApi.createProduct(storeId!, form),
    onSuccess: () => {
      setForm({ name: "", category: "", unitPrice: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 5 });
      invalidate();
    },
  });

  const adjustStock = useMutation({
    mutationFn: (vars: { productId: string; quantityChange: number; reason: string }) =>
      liquorApi.adjustStock(vars.productId, { quantityChange: vars.quantityChange, reason: vars.reason }),
    onSuccess: invalidate,
  });

  const transfer = useMutation({
    mutationFn: (productId: string) =>
      liquorApi.transferToRestaurant(storeId!, productId, {
        quantity: transferQty,
        retailPrice: transferRetailPrice || undefined,
      }),
    onSuccess: () => {
      setTransferProductId(null);
      setTransferQty(1);
      setTransferRetailPrice(0);
      invalidate();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim()) createProduct.mutate();
  }

  function openTransfer(productId: string, suggestedRetail: number) {
    setTransferProductId(productId);
    setTransferQty(1);
    setTransferRetailPrice(Math.round(suggestedRetail * 100) / 100);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventory</h1>
        <Button variant="secondary" onClick={() => navigate("/liquor")}>
          Back to stores
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {products?.map((p) => {
          const low = p.stockQuantity <= p.lowStockThreshold;
          return (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.category}</div>
                </div>
                {low && <Badge color="red">Low stock</Badge>}
              </div>
              <div className="text-sm mt-2">
                Stock: <span className="font-semibold">{p.stockQuantity}</span> · Wholesale {formatMoney(Number(p.unitPrice))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => adjustStock.mutate({ productId: p.id, quantityChange: 10, reason: "Restock" })}
                  disabled={adjustStock.isPending}
                >
                  +10 restock
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => adjustStock.mutate({ productId: p.id, quantityChange: -1, reason: "Correction" })}
                  disabled={adjustStock.isPending || p.stockQuantity <= 0}
                >
                  -1 correct
                </Button>
              </div>

              {transferProductId === p.id ? (
                <div className="mt-2 border-t border-slate-200 pt-2 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        max={p.stockQuantity}
                        value={transferQty}
                        onChange={(e) => setTransferQty(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Retail price</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={transferRetailPrice}
                        onChange={(e) => setTransferRetailPrice(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={transfer.isPending || transferQty < 1 || transferQty > p.stockQuantity}
                      onClick={() => transfer.mutate(p.id)}
                    >
                      Confirm transfer
                    </Button>
                    <Button variant="secondary" onClick={() => setTransferProductId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => openTransfer(p.id, Number(p.unitPrice) * 1.5)}
                  disabled={p.stockQuantity <= 0}
                >
                  Transfer to restaurant
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="max-w-lg">
        <h2 className="font-semibold mb-2">Add a new product</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Product name"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Category (e.g. Beer, Spirits)"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Starting stock</label>
              <input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Low stock threshold</label>
              <input
                type="number"
                min={0}
                value={form.lowStockThreshold}
                onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={createProduct.isPending}>
            Add product
          </Button>
        </form>
      </Card>

      <Card className="max-w-lg mt-6">
        <h2 className="font-semibold mb-2">Recent transfers to restaurant</h2>
        {transfers?.length === 0 && <p className="text-sm text-slate-400">No transfers yet.</p>}
        <div className="space-y-2">
          {transfers?.map((t) => (
            <div key={t.id} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {t.quantity} × {t.product.name}
                </span>
                <span>{formatMoney(Number(t.wholesalePrice) * t.quantity)} wholesale</span>
              </div>
              <div className="text-xs text-slate-400">
                {new Date(t.createdAt).toLocaleString()} · by {t.staff.fullName} · retail set to{" "}
                {formatMoney(Number(t.retailPrice))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
