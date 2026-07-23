import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { LiquorProductCard } from "../components/LiquorProductCard";
import { LiquorProductDetailsModal } from "../components/LiquorProductDetailsModal";
import { LiquorTransferModal } from "../components/LiquorTransferModal";
import { LiquorCategory, LiquorProduct, liquorApi } from "../api";

const CATEGORIES: LiquorCategory[] = ["BEER", "WINE", "SPIRITS", "LIQUEUR", "READY_TO_DRINK", "NON_ALCOHOLIC"];
const CATEGORY_LABEL: Record<LiquorCategory, string> = {
  BEER: "Beer",
  WINE: "Wine",
  SPIRITS: "Spirits",
  LIQUEUR: "Liqueur",
  READY_TO_DRINK: "Ready to drink",
  NON_ALCOHOLIC: "Non-alcoholic",
};
type SortKey = "name" | "price-asc" | "price-desc" | "stock";

const emptyForm = { name: "", brand: "", category: "BEER" as LiquorCategory, unitPrice: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 5 };

export function StoreInventoryPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stores } = useQuery({ queryKey: ["liquor-stores"], queryFn: liquorApi.listStores });
  const store = stores?.find((s) => s.id === storeId);

  const { data: products, isLoading } = useQuery({
    queryKey: ["liquor-products", storeId],
    queryFn: () => liquorApi.listProducts(storeId!),
    enabled: !!storeId,
  });
  const { data: transfers } = useQuery({
    queryKey: ["liquor-transfers", storeId],
    queryFn: () => liquorApi.listTransfers(storeId!),
    enabled: !!storeId,
  });

  const [search, setSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Set<LiquorCategory> | null>(null);
  const [brandFilter, setBrandFilter] = useState<Set<string> | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [sort, setSort] = useState<SortKey>("name");
  const [detailsProduct, setDetailsProduct] = useState<LiquorProduct | null>(null);
  const [transferProduct, setTransferProduct] = useState<LiquorProduct | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products?.forEach((p) => p.brand && set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  const activeCategoryFilter = categoryFilter ?? new Set(CATEGORIES);
  const activeBrandFilter = brandFilter ?? new Set(brands);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products?.forEach((p) => (counts[p.category] = (counts[p.category] ?? 0) + 1));
    return counts;
  }, [products]);

  const isNew = (p: LiquorProduct) => Date.now() - new Date(p.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (products ?? []).filter((p) => {
      if (!activeCategoryFilter.has(p.category)) return false;
      if (p.brand && !activeBrandFilter.has(p.brand)) return false;
      if (lowStockOnly && p.stockQuantity > p.lowStockThreshold) return false;
      if (newOnly && !isNew(p)) return false;
      if (featuredOnly && !p.isFeatured) return false;
      if (priceMin !== "" && Number(p.unitPrice) < priceMin) return false;
      if (priceMax !== "" && Number(p.unitPrice) > priceMax) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.brand ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => Number(b.unitPrice) - Number(a.unitPrice));
        break;
      case "stock":
        list = [...list].sort((a, b) => a.stockQuantity - b.stockQuantity);
        break;
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, activeCategoryFilter, activeBrandFilter, lowStockOnly, newOnly, featuredOnly, priceMin, priceMax, search, sort]);

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ["liquor-products", storeId] });

  const createProduct = useMutation({
    mutationFn: () => liquorApi.createProduct(storeId!, { ...form, brand: form.brand || undefined }),
    onSuccess: () => {
      setForm(emptyForm);
      setShowAddForm(false);
      invalidateProducts();
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: (p: LiquorProduct) => liquorApi.setFeatured(p.id, !p.isFeatured),
    onSuccess: invalidateProducts,
  });

  function toggleSetValue<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim()) createProduct.mutate();
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden mb-6 relative bg-gradient-to-r from-indigo-800 via-liquor to-emerald-700">
        <div className="px-8 py-10 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold">{store?.name ?? "Liquor Store Catalog"}</h1>
          <p className="text-white/80 text-sm mt-1">
            {store?.location ?? "Wholesale inventory"} — the store's only outlet is the restaurant bar
          </p>
        </div>
        <div className="bg-white px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <button onClick={() => navigate("/liquor")} className="font-semibold text-slate-400 hover:text-slate-600">
              ← Stores
            </button>
            <span className="font-semibold text-liquor border-b-2 border-liquor pb-3 -mb-3">Products</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="border border-slate-300 rounded-full px-4 py-1.5 text-sm w-64"
            />
            <Button onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? "Close form" : "+ Add product"}</Button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <Card className="max-w-2xl mb-6">
          <h2 className="font-semibold mb-2">Add a new product</h2>
          <form onSubmit={handleAddSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Brand"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as LiquorCategory }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Wholesale price</label>
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
      )}

      <div className="flex gap-6 items-start">
        {/* Sidebar filters */}
        <aside className="w-56 shrink-0 bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Filter</h2>

          <input
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder="Search brand name"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm mb-4"
          />

          <div className="space-y-1.5 mb-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lowStockOnly} onChange={() => setLowStockOnly((v) => !v)} />
              Low stock
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newOnly} onChange={() => setNewOnly((v) => !v)} />
              New product
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={featuredOnly} onChange={() => setFeaturedOnly((v) => !v)} />
              Featured products
            </label>
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Price range (KES)</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Min"
                className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
              />
              <span className="text-slate-300">–</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Max"
                className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Category</div>
            <div className="space-y-1.5 text-sm">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeCategoryFilter.has(c)}
                      onChange={() => toggleSetValue(activeCategoryFilter, c, setCategoryFilter)}
                    />
                    {CATEGORY_LABEL[c]}
                  </span>
                  <span className="text-slate-400">{categoryCounts[c] ?? 0}</span>
                </label>
              ))}
            </div>
          </div>

          {brands.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Brands</div>
              <div className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
                {brands
                  .filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
                  .map((b) => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBrandFilter.has(b)}
                        onChange={() => toggleSetValue(activeBrandFilter, b, setBrandFilter)}
                      />
                      {b}
                    </label>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Products <span className="text-slate-400 font-normal normal-case">({filtered.length})</span>
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="name">Name</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="stock">Stock level</option>
            </select>
          </div>

          {isLoading && <p className="text-slate-500">Loading products…</p>}
          {!isLoading && filtered.length === 0 && <p className="text-slate-400 text-sm">No products match these filters.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {filtered.map((p) => (
              <LiquorProductCard
                key={p.id}
                product={p}
                onToggleFeatured={() => toggleFeatured.mutate(p)}
                onTransfer={() => setTransferProduct(p)}
                onDetails={() => setDetailsProduct(p)}
              />
            ))}
          </div>

          <Card>
            <h2 className="font-semibold mb-2">Recent transfers to restaurant</h2>
            {transfers?.length === 0 && <p className="text-sm text-slate-400">No transfers yet.</p>}
            <div className="space-y-2">
              {transfers?.map((t) => (
                <div key={t.id} className="text-sm border-b border-slate-100 pb-2">
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
      </div>

      {detailsProduct && <LiquorProductDetailsModal product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      {transferProduct && <LiquorTransferModal product={transferProduct} onClose={() => setTransferProduct(null)} />}
    </div>
  );
}
