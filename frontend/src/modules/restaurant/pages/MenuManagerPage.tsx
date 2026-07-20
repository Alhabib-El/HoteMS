import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { restaurantApi } from "../api";

export function MenuManagerPage() {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ["menu"], queryFn: restaurantApi.listCategories });

  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemCategoryId, setItemCategoryId] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu"] });

  const createCategory = useMutation({
    mutationFn: restaurantApi.createCategory,
    onSuccess: () => {
      setCategoryName("");
      invalidate();
    },
  });

  const createItem = useMutation({
    mutationFn: restaurantApi.createMenuItem,
    onSuccess: () => {
      setItemName("");
      setItemPrice(0);
      invalidate();
    },
  });

  function handleCategorySubmit(e: FormEvent) {
    e.preventDefault();
    if (categoryName.trim()) createCategory.mutate({ name: categoryName.trim() });
  }

  function handleItemSubmit(e: FormEvent) {
    e.preventDefault();
    if (itemName.trim() && itemCategoryId) {
      createItem.mutate({ name: itemName.trim(), price: itemPrice, categoryId: itemCategoryId });
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Menu management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="font-semibold mb-2">Add category</h2>
          <form onSubmit={handleCategorySubmit} className="flex gap-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Desserts"
              className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <Button type="submit" disabled={createCategory.isPending}>
              Add
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Add menu item</h2>
          <form onSubmit={handleItemSubmit} className="space-y-2">
            <select
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— category —</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={itemPrice}
                onChange={(e) => setItemPrice(Number(e.target.value))}
                className="w-24 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <Button type="submit" disabled={createItem.isPending}>
                Add
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {categories?.map((cat) => (
        <div key={cat.id} className="mb-4">
          <h2 className="text-sm font-semibold text-slate-500 mb-2">{cat.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cat.items.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.stockQuantity !== null && <Badge color={item.stockQuantity <= (item.lowStockThreshold ?? 0) ? "red" : "blue"}>Bar</Badge>}
                </div>
                <div className="text-xs text-slate-500">{formatMoney(Number(item.price))}</div>
                {item.stockQuantity !== null && (
                  <div className="text-xs text-slate-400 mt-1">Stock: {item.stockQuantity}</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
