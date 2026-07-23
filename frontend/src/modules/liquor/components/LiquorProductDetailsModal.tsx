import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { formatMoney } from "../../../shared/utils/currency";
import { LiquorProduct, liquorApi } from "../api";
import { BottleIcon } from "./BottleIcon";

const CATEGORY_LABEL: Record<LiquorProduct["category"], string> = {
  BEER: "Beer",
  WINE: "Wine",
  SPIRITS: "Spirits",
  LIQUEUR: "Liqueur",
  READY_TO_DRINK: "Ready to drink",
  NON_ALCOHOLIC: "Non-alcoholic",
};

export function LiquorProductDetailsModal({ product, onClose }: { product: LiquorProduct; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(10);
  const [reason, setReason] = useState("Restock");

  const adjustStock = useMutation({
    mutationFn: (quantityChange: number) => liquorApi.adjustStock(product.id, { quantityChange, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["liquor-products", product.storeId] }),
  });

  const margin = Number(product.unitPrice) - Number(product.costPrice);
  const marginPct = Number(product.costPrice) > 0 ? (margin / Number(product.costPrice)) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
        <div className="flex items-start gap-4 mb-4">
          <BottleIcon category={product.category} className="h-20 shrink-0" />
          <div>
            <h2 className="text-lg font-bold leading-tight">{product.name}</h2>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">
              {CATEGORY_LABEL[product.category]}
              {product.brand && ` · ${product.brand}`}
            </div>
            {product.stockQuantity <= product.lowStockThreshold && <Badge color="red">Low stock</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-1.5 text-sm mb-4">
          <div className="text-slate-500">Wholesale price</div>
          <div className="font-medium">{formatMoney(Number(product.unitPrice))}</div>
          <div className="text-slate-500">Cost price</div>
          <div className="font-medium">{formatMoney(Number(product.costPrice))}</div>
          <div className="text-slate-500">Margin</div>
          <div className="font-medium">
            {formatMoney(margin)} ({marginPct.toFixed(0)}%)
          </div>
          <div className="text-slate-500">Stock on hand</div>
          <div className="font-medium">{product.stockQuantity}</div>
          <div className="text-slate-500">Low stock threshold</div>
          <div className="font-medium">{product.lowStockThreshold}</div>
          <div className="text-slate-500">Added</div>
          <div className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">Adjust stock</div>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-24 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={adjustStock.isPending || qty === 0} onClick={() => adjustStock.mutate(qty)}>
              Add stock
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={adjustStock.isPending || qty === 0 || qty > product.stockQuantity}
              onClick={() => adjustStock.mutate(-qty)}
            >
              Remove stock
            </Button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
