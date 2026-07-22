import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { RoomsTabs } from "../components/RoomsTabs";
import { RoomSupplyCategory, RoomSupplyRequirement, roomsApi } from "../api";

const CATEGORIES: RoomSupplyCategory[] = ["LINEN", "TOILETRIES", "AMENITIES", "CLEANING"];
const CATEGORY_LABEL: Record<RoomSupplyCategory, string> = {
  LINEN: "Linen",
  TOILETRIES: "Toiletries",
  AMENITIES: "Amenities",
  CLEANING: "Cleaning supplies",
};

export function RoomInventoryPage() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["room-supplies"], queryFn: roomsApi.listSupplyItems });
  const { data: roomTypes } = useQuery({ queryKey: ["room-types"], queryFn: roomsApi.listRoomTypes });
  const { data: requirements } = useQuery({
    queryKey: ["room-supply-requirements"],
    queryFn: roomsApi.listSupplyRequirements,
  });

  const [itemForm, setItemForm] = useState({
    name: "",
    category: "LINEN" as RoomSupplyCategory,
    unit: "pcs",
    stockQuantity: 0,
    lowStockThreshold: 10,
    costPrice: 0,
  });
  const [parForm, setParForm] = useState({ roomTypeId: "", supplyItemId: "", quantityPerClean: 1 });

  const invalidateItems = () => queryClient.invalidateQueries({ queryKey: ["room-supplies"] });

  const createItem = useMutation({
    mutationFn: () => roomsApi.createSupplyItem(itemForm),
    onSuccess: () => {
      setItemForm({ name: "", category: "LINEN", unit: "pcs", stockQuantity: 0, lowStockThreshold: 10, costPrice: 0 });
      invalidateItems();
    },
  });

  const adjustStock = useMutation({
    mutationFn: (vars: { supplyItemId: string; quantityChange: number; reason: string }) =>
      roomsApi.adjustSupplyStock(vars.supplyItemId, { quantityChange: vars.quantityChange, reason: vars.reason }),
    onSuccess: invalidateItems,
  });

  const upsertRequirement = useMutation({
    mutationFn: () => roomsApi.upsertSupplyRequirement(parForm),
    onSuccess: () => {
      setParForm({ roomTypeId: "", supplyItemId: "", quantityPerClean: 1 });
      queryClient.invalidateQueries({ queryKey: ["room-supply-requirements"] });
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: (id: string) => roomsApi.deleteSupplyRequirement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["room-supply-requirements"] }),
  });

  function handleItemSubmit(e: FormEvent) {
    e.preventDefault();
    if (itemForm.name.trim() && itemForm.unit.trim()) createItem.mutate();
  }

  function handleParSubmit(e: FormEvent) {
    e.preventDefault();
    if (parForm.roomTypeId && parForm.supplyItemId && parForm.quantityPerClean > 0) upsertRequirement.mutate();
  }

  const groupedByType = new Map<string, RoomSupplyRequirement[]>();
  requirements?.forEach((r) => {
    const list = groupedByType.get(r.roomTypeId) ?? [];
    list.push(r);
    groupedByType.set(r.roomTypeId, list);
  });

  return (
    <div>
      <RoomsTabs />
      <h1 className="text-xl font-bold mb-1">Room supply inventory</h1>
      <p className="text-sm text-slate-500 mb-4">
        Central housekeeping store — linens, toiletries, guest amenities and cleaning stock. Marking a room "Clean" in
        Housekeeping automatically consumes its room type's par-level supplies from here.
      </p>

      {isLoading && <p className="text-slate-500">Loading inventory…</p>}

      {CATEGORIES.map((cat) => {
        const catItems = items?.filter((i) => i.category === cat) ?? [];
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-2">{CATEGORY_LABEL[cat]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catItems.map((item) => {
                const low = item.stockQuantity <= item.lowStockThreshold;
                return (
                  <Card key={item.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatMoney(Number(item.costPrice))} / {item.unit}
                        </div>
                      </div>
                      {low && <Badge color="red">Low stock</Badge>}
                    </div>
                    <div className="text-sm mt-2">
                      Stock: <span className="font-semibold">{item.stockQuantity}</span> {item.unit}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={adjustStock.isPending}
                        onClick={() => adjustStock.mutate({ supplyItemId: item.id, quantityChange: 20, reason: "Restock" })}
                      >
                        +20 restock
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={adjustStock.isPending || item.stockQuantity <= 0}
                        onClick={() => adjustStock.mutate({ supplyItemId: item.id, quantityChange: -1, reason: "Correction" })}
                      >
                        -1 correct
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Card className="max-w-lg mb-6">
        <h2 className="font-semibold mb-2">Add a new supply item</h2>
        <form onSubmit={handleItemSubmit} className="space-y-2">
          <input
            value={itemForm.name}
            onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Item name (e.g. Beach Towel)"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={itemForm.category}
              onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value as RoomSupplyCategory }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <input
              value={itemForm.unit}
              onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="Unit (pcs, roll, bottle...)"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Starting stock</label>
              <input
                type="number"
                min={0}
                value={itemForm.stockQuantity}
                onChange={(e) => setItemForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Low stock threshold</label>
              <input
                type="number"
                min={0}
                value={itemForm.lowStockThreshold}
                onChange={(e) => setItemForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost / unit (KES)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={itemForm.costPrice}
                onChange={(e) => setItemForm((f) => ({ ...f, costPrice: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={createItem.isPending}>
            Add supply item
          </Button>
        </form>
      </Card>

      <h2 className="text-lg font-bold mb-1">Par levels</h2>
      <p className="text-sm text-slate-500 mb-3">How many units of each item a room type consumes per clean.</p>

      <Card className="max-w-xl mb-6">
        <h3 className="font-semibold mb-2">Set a par level</h3>
        <form onSubmit={handleParSubmit} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Room type</label>
            <select
              value={parForm.roomTypeId}
              onChange={(e) => setParForm((f) => ({ ...f, roomTypeId: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— room type —</option>
              {roomTypes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Supply item</label>
            <select
              value={parForm.supplyItemId}
              onChange={(e) => setParForm((f) => ({ ...f, supplyItemId: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— supply item —</option>
              {items
                ?.filter((i) => i.category !== "CLEANING")
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-600 mb-1">Qty / clean</label>
            <input
              type="number"
              min={1}
              value={parForm.quantityPerClean}
              onChange={(e) => setParForm((f) => ({ ...f, quantityPerClean: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <Button type="submit" disabled={upsertRequirement.isPending}>
            Save
          </Button>
        </form>
      </Card>

      {roomTypes?.map((type) => {
        const reqs = groupedByType.get(type.id) ?? [];
        if (reqs.length === 0) return null;
        return (
          <div key={type.id} className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">{type.name}</h3>
            <div className="space-y-1">
              {reqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded-md px-3 py-1.5">
                  <span>
                    {r.supplyItem.name} <span className="text-xs text-slate-400">({r.supplyItem.unit})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{r.quantityPerClean} / clean</span>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deleteRequirement.mutate(r.id)}
                      disabled={deleteRequirement.isPending}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
