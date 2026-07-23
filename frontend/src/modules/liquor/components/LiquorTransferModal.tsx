import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../../shared/components/Button";
import { LiquorProduct, liquorApi } from "../api";
import { BottleIcon } from "./BottleIcon";

export function LiquorTransferModal({ product, onClose }: { product: LiquorProduct; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [retailPrice, setRetailPrice] = useState(Math.round(Number(product.unitPrice) * 1.5 * 100) / 100);

  const transfer = useMutation({
    mutationFn: () =>
      liquorApi.transferToRestaurant(product.storeId, product.id, { quantity, retailPrice: retailPrice || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquor-products", product.storeId] });
      queryClient.invalidateQueries({ queryKey: ["liquor-transfers", product.storeId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <BottleIcon category={product.category} className="h-14 shrink-0" />
          <div>
            <h2 className="text-lg font-bold leading-tight">Transfer to restaurant</h2>
            <p className="text-xs text-slate-500">{product.name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantity (stock: {product.stockQuantity})</label>
            <input
              type="number"
              min={1}
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Retail price at restaurant bar</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={retailPrice}
              onChange={(e) => setRetailPrice(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        {transfer.isError && <p className="text-sm text-red-600 mt-2">Transfer failed. Check quantity and retail price.</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={transfer.isPending || quantity < 1 || quantity > product.stockQuantity}
            onClick={() => transfer.mutate()}
          >
            {transfer.isPending ? "Transferring…" : "Confirm transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
