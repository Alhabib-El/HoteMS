import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { RestaurantTabs } from "../components/RestaurantTabs";
import { IngredientCategory, RecipeLine, restaurantApi } from "../api";

const CATEGORIES: IngredientCategory[] = ["PROTEIN", "PRODUCE", "DAIRY", "PANTRY", "BEVERAGE", "FROZEN", "BAKERY"];
const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  PROTEIN: "Protein",
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  PANTRY: "Pantry",
  BEVERAGE: "Beverage",
  FROZEN: "Frozen",
  BAKERY: "Bakery",
};

export function RestaurantInventoryPage() {
  const queryClient = useQueryClient();
  const { data: ingredients, isLoading } = useQuery({
    queryKey: ["restaurant-ingredients"],
    queryFn: restaurantApi.listIngredients,
  });
  const { data: categories } = useQuery({ queryKey: ["menu"], queryFn: restaurantApi.listCategories });
  const { data: recipes } = useQuery({ queryKey: ["restaurant-recipes"], queryFn: restaurantApi.listRecipes });

  const menuItems = categories?.flatMap((c) => c.items) ?? [];

  const [itemForm, setItemForm] = useState({
    name: "",
    category: "PRODUCE" as IngredientCategory,
    unit: "kg",
    stockQuantity: 0,
    lowStockThreshold: 5,
    costPerUnit: 0,
    supplier: "",
  });
  const [recipeForm, setRecipeForm] = useState({ menuItemId: "", ingredientId: "", quantityPerServing: 0.1 });

  const invalidateIngredients = () => queryClient.invalidateQueries({ queryKey: ["restaurant-ingredients"] });

  const createIngredient = useMutation({
    mutationFn: () => restaurantApi.createIngredient(itemForm),
    onSuccess: () => {
      setItemForm({ name: "", category: "PRODUCE", unit: "kg", stockQuantity: 0, lowStockThreshold: 5, costPerUnit: 0, supplier: "" });
      invalidateIngredients();
    },
  });

  const adjustStock = useMutation({
    mutationFn: (vars: { ingredientId: string; quantityChange: number; reason: string }) =>
      restaurantApi.adjustIngredientStock(vars.ingredientId, { quantityChange: vars.quantityChange, reason: vars.reason }),
    onSuccess: () => {
      invalidateIngredients();
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const upsertRecipe = useMutation({
    mutationFn: () => restaurantApi.upsertRecipeLine(recipeForm),
    onSuccess: () => {
      setRecipeForm({ menuItemId: "", ingredientId: "", quantityPerServing: 0.1 });
      queryClient.invalidateQueries({ queryKey: ["restaurant-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: (id: string) => restaurantApi.deleteRecipeLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });

  function handleItemSubmit(e: FormEvent) {
    e.preventDefault();
    if (itemForm.name.trim() && itemForm.unit.trim()) {
      createIngredient.mutate();
    }
  }

  function handleRecipeSubmit(e: FormEvent) {
    e.preventDefault();
    if (recipeForm.menuItemId && recipeForm.ingredientId && recipeForm.quantityPerServing > 0) {
      upsertRecipe.mutate();
    }
  }

  const groupedByMenuItem = new Map<string, RecipeLine[]>();
  recipes?.forEach((r) => {
    const list = groupedByMenuItem.get(r.menuItemId) ?? [];
    list.push(r);
    groupedByMenuItem.set(r.menuItemId, list);
  });

  return (
    <div>
      <RestaurantTabs />
      <h1 className="text-xl font-bold mb-1">Kitchen ingredient inventory</h1>
      <p className="text-sm text-slate-500 mb-4">
        Raw materials the kitchen cooks with. Recipes below define each dish's bill of materials — placing an order
        automatically consumes ingredient stock, and a dish is auto-86'd (blocked) once it can't be made.
      </p>

      {isLoading && <p className="text-slate-500">Loading ingredients…</p>}

      {CATEGORIES.map((cat) => {
        const catItems = ingredients?.filter((i) => i.category === cat) ?? [];
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-2">{CATEGORY_LABEL[cat]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catItems.map((item) => {
                const low = Number(item.stockQuantity) <= Number(item.lowStockThreshold);
                return (
                  <Card key={item.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatMoney(Number(item.costPerUnit))} / {item.unit}
                          {item.supplier && ` · ${item.supplier}`}
                        </div>
                      </div>
                      {low && <Badge color="red">Low stock</Badge>}
                    </div>
                    <div className="text-sm mt-2">
                      Stock: <span className="font-semibold">{Number(item.stockQuantity)}</span> {item.unit}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={adjustStock.isPending}
                        onClick={() => adjustStock.mutate({ ingredientId: item.id, quantityChange: 10, reason: "Restock" })}
                      >
                        +10 restock
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={adjustStock.isPending || Number(item.stockQuantity) <= 0}
                        onClick={() => adjustStock.mutate({ ingredientId: item.id, quantityChange: -1, reason: "Correction" })}
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
        <h2 className="font-semibold mb-2">Add a new ingredient</h2>
        <form onSubmit={handleItemSubmit} className="space-y-2">
          <input
            value={itemForm.name}
            onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ingredient name (e.g. Basil)"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={itemForm.category}
              onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value as IngredientCategory }))}
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
              placeholder="Unit (kg, liter, piece...)"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <input
            value={itemForm.supplier}
            onChange={(e) => setItemForm((f) => ({ ...f, supplier: e.target.value }))}
            placeholder="Supplier (optional)"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Starting stock</label>
              <input
                type="number"
                min={0}
                step="0.01"
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
                step="0.01"
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
                value={itemForm.costPerUnit}
                onChange={(e) => setItemForm((f) => ({ ...f, costPerUnit: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={createIngredient.isPending}>
            Add ingredient
          </Button>
        </form>
      </Card>

      <h2 className="text-lg font-bold mb-1">Recipes</h2>
      <p className="text-sm text-slate-500 mb-3">How much of each ingredient one serving of a dish needs.</p>

      <Card className="max-w-xl mb-6">
        <h3 className="font-semibold mb-2">Add a recipe line</h3>
        <form onSubmit={handleRecipeSubmit} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Menu item</label>
            <select
              value={recipeForm.menuItemId}
              onChange={(e) => setRecipeForm((f) => ({ ...f, menuItemId: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— menu item —</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Ingredient</label>
            <select
              value={recipeForm.ingredientId}
              onChange={(e) => setRecipeForm((f) => ({ ...f, ingredientId: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— ingredient —</option>
              {ingredients?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-slate-600 mb-1">Qty / serving</label>
            <input
              type="number"
              min={0.001}
              step="0.001"
              value={recipeForm.quantityPerServing}
              onChange={(e) => setRecipeForm((f) => ({ ...f, quantityPerServing: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <Button type="submit" disabled={upsertRecipe.isPending}>
            Save
          </Button>
        </form>
      </Card>

      {menuItems.map((item) => {
        const lines = groupedByMenuItem.get(item.id) ?? [];
        if (lines.length === 0) return null;
        return (
          <div key={item.id} className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">{item.name}</h3>
            <div className="space-y-1">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded-md px-3 py-1.5"
                >
                  <span>
                    {line.ingredient.name} <span className="text-xs text-slate-400">({line.ingredient.unit})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {Number(line.quantityPerServing)} {line.ingredient.unit} / serving
                    </span>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deleteRecipe.mutate(line.id)}
                      disabled={deleteRecipe.isPending}
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
