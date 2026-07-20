import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { liquorApi } from "../api";

export function StoreListPage() {
  const queryClient = useQueryClient();
  const { data: stores, isLoading } = useQuery({ queryKey: ["liquor-stores"], queryFn: liquorApi.listStores });
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const createStore = useMutation({
    mutationFn: liquorApi.createStore,
    onSuccess: () => {
      setName("");
      setLocation("");
      queryClient.invalidateQueries({ queryKey: ["liquor-stores"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) createStore.mutate({ name: name.trim(), location: location.trim() || undefined });
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Liquor stores</h1>

      {isLoading && <p className="text-slate-500">Loading stores…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stores?.map((store) => (
          <Card key={store.id}>
            <div className="font-bold">{store.name}</div>
            {store.location && <div className="text-xs text-slate-500">{store.location}</div>}
            <div className="mt-3">
              <Link to={`/liquor/stores/${store.id}`}>
                <Button className="w-full">Manage inventory</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card className="max-w-md">
        <h2 className="font-semibold mb-2">Add a new store</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Store name"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <Button type="submit" disabled={createStore.isPending}>
            Add store
          </Button>
        </form>
      </Card>
    </div>
  );
}
