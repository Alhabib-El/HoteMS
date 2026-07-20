import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { roomsApi } from "../api";

export function ManageRoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: roomTypes } = useQuery({ queryKey: ["room-types"], queryFn: roomsApi.listRoomTypes });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: roomsApi.listRooms });

  const [typeForm, setTypeForm] = useState({ name: "", basePrice: 0, capacity: 2, description: "" });
  const [roomForm, setRoomForm] = useState({ number: "", keyNumber: "", floor: 1, roomTypeId: "" });

  const createRoomType = useMutation({
    mutationFn: () => roomsApi.createRoomType(typeForm),
    onSuccess: () => {
      setTypeForm({ name: "", basePrice: 0, capacity: 2, description: "" });
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
    },
  });

  const createRoom = useMutation({
    mutationFn: () => roomsApi.createRoom(roomForm),
    onSuccess: () => {
      setRoomForm({ number: "", keyNumber: "", floor: 1, roomTypeId: roomForm.roomTypeId });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  function handleTypeSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeForm.name.trim()) createRoomType.mutate();
  }

  function handleRoomSubmit(e: FormEvent) {
    e.preventDefault();
    if (roomForm.number.trim() && roomForm.keyNumber.trim() && roomForm.roomTypeId) createRoom.mutate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Manage rooms &amp; room types</h1>
        <Button variant="secondary" onClick={() => navigate("/rooms")}>
          Back to room board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="font-semibold mb-2">Add room type</h2>
          <form onSubmit={handleTypeSubmit} className="space-y-2">
            <input
              value={typeForm.name}
              onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Executive Suite"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <input
              value={typeForm.description}
              onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Base price / night (KES)</label>
                <input
                  type="number"
                  min={0}
                  value={typeForm.basePrice}
                  onChange={(e) => setTypeForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Capacity (guests)</label>
                <input
                  type="number"
                  min={1}
                  value={typeForm.capacity}
                  onChange={(e) => setTypeForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <Button type="submit" disabled={createRoomType.isPending}>
              Add room type
            </Button>
          </form>

          <div className="mt-4 space-y-1">
            {roomTypes?.map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>
                  {t.name} <span className="text-xs text-slate-400">(sleeps {t.capacity})</span>
                </span>
                <span>{formatMoney(Number(t.basePrice))}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Add room</h2>
          <form onSubmit={handleRoomSubmit} className="space-y-2">
            <select
              value={roomForm.roomTypeId}
              onChange={(e) => setRoomForm((f) => ({ ...f, roomTypeId: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">— room type —</option>
              {roomTypes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Room number</label>
                <input
                  value={roomForm.number}
                  onChange={(e) => setRoomForm((f) => ({ ...f, number: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Key number</label>
                <input
                  value={roomForm.keyNumber}
                  onChange={(e) => setRoomForm((f) => ({ ...f, keyNumber: e.target.value }))}
                  placeholder="e.g. K101"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Floor</label>
                <input
                  type="number"
                  min={0}
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm((f) => ({ ...f, floor: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <Button type="submit" disabled={createRoom.isPending || !roomTypes?.length}>
              Add room
            </Button>
          </form>

          <div className="mt-4 space-y-1">
            {rooms?.map((r) => (
              <div key={r.id} className="flex justify-between text-sm">
                <span>
                  Room {r.number} <span className="text-xs text-slate-400">(floor {r.floor}, key {r.keyNumber})</span>
                </span>
                <span className="text-slate-500">{r.roomType.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
