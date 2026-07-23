import { Badge } from "../../../shared/components/Badge";
import { formatMoney } from "../../../shared/utils/currency";
import { LiquorProduct } from "../api";
import { BottleIcon } from "./BottleIcon";

const CATEGORY_LABEL: Record<LiquorProduct["category"], string> = {
  BEER: "Beer",
  WINE: "Wine",
  SPIRITS: "Spirits",
  LIQUEUR: "Liqueur",
  READY_TO_DRINK: "Ready to drink",
  NON_ALCOHOLIC: "Non-alcoholic",
};

export function LiquorProductCard({
  product,
  onToggleFeatured,
  onTransfer,
  onDetails,
}: {
  product: LiquorProduct;
  onToggleFeatured: () => void;
  onTransfer: () => void;
  onDetails: () => void;
}) {
  const low = product.stockQuantity <= product.lowStockThreshold;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition p-4 flex flex-col">
      <div className="relative flex justify-center items-center h-28 mb-3">
        <BottleIcon category={product.category} className="h-full" />
        <button
          onClick={onToggleFeatured}
          aria-label="Toggle featured"
          className={`absolute top-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
            product.isFeatured ? "text-rose-500" : "text-slate-300 hover:text-rose-400"
          }`}
        >
          {product.isFeatured ? "♥" : "♡"}
        </button>
        {low && (
          <div className="absolute top-0 left-0">
            <Badge color="red">Low stock</Badge>
          </div>
        )}
      </div>

      <div className="text-sm font-bold text-slate-800 leading-tight" title={product.name}>
        {product.name}
      </div>
      <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5 mb-2">
        {CATEGORY_LABEL[product.category]}
        {product.brand && ` · ${product.brand}`}
      </div>

      <div className="flex items-baseline justify-between mb-1">
        <span className="text-blue-600 font-bold">{formatMoney(Number(product.unitPrice))}</span>
        <span className="text-xs text-slate-400">{product.stockQuantity} in stock</span>
      </div>

      <div className="mt-auto pt-3 flex items-center gap-2">
        <button
          onClick={onTransfer}
          disabled={product.stockQuantity <= 0}
          title="Transfer to restaurant"
          className="w-9 h-9 shrink-0 rounded-full bg-liquor text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90"
        >
          🚚
        </button>
        <button
          onClick={onDetails}
          className="flex-1 rounded-full border border-emerald-400 text-emerald-600 text-xs font-semibold py-1.5 hover:bg-emerald-50"
        >
          Details
        </button>
      </div>
    </div>
  );
}
