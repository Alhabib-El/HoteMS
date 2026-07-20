import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { formatMoney } from "../../../shared/utils/currency";
import { Room, roomsApi } from "../api";

const STANDARD_CHECKOUT_HOUR = 10;

function standardCheckoutDate(nights: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + nights);
  d.setHours(STANDARD_CHECKOUT_HOUR, 0, 0, 0);
  return d;
}

function shortStayCheckoutDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function CheckInForm({ room, onClose }: { room: Room; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [isShortStay, setIsShortStay] = useState(false);
  const [nights, setNights] = useState(1);
  const [hours, setHours] = useState(3);
  const basePrice = Number(room.roomType.basePrice);
  const [ratePerNight, setRatePerNight] = useState(basePrice);
  const [shortStayRate, setShortStayRate] = useState(Math.round(basePrice / 2));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: roomsApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    },
  });

  function handleToggleShortStay(checked: boolean) {
    setIsShortStay(checked);
  }

  const expectedCheckOut = isShortStay ? shortStayCheckoutDate(hours) : standardCheckoutDate(nights);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      roomId: room.id,
      guest: { fullName, phone: phone || undefined, email: email || undefined, idNumber: idNumber || undefined },
      expectedCheckOutAt: expectedCheckOut.toISOString(),
      ratePerNight: isShortStay ? shortStayRate : ratePerNight,
      isShortStay,
      notes: notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto p-5 space-y-3"
      >
        <h2 className="text-lg font-bold">Check in — Room {room.number}</h2>
        <p className="text-sm text-slate-500">
          {room.roomType.name} · Key {room.keyNumber}
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Guest full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">ID number</label>
          <input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-2">
          <input
            type="checkbox"
            checked={isShortStay}
            onChange={(e) => handleToggleShortStay(e.target.checked)}
          />
          Short stay (day use) — lower rate than overnight
        </label>

        {isShortStay ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Hours</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Short-stay rate (flat)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={shortStayRate}
                onChange={(e) => setShortStayRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nights</label>
              <input
                type="number"
                min={1}
                required
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Rate / night</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={ratePerNight}
                onChange={(e) => setRatePerNight(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Expected checkout: <span className="font-medium text-slate-700">{expectedCheckOut.toLocaleString()}</span>
          {!isShortStay && " (standard 10:00 AM checkout)"}
          {" · Total: "}
          <span className="font-medium text-slate-700">{formatMoney(isShortStay ? shortStayRate : nights * ratePerNight)}</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Special requests / notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. late arrival, extra pillows, allergy info"
            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm resize-none"
          />
        </div>

        {mutation.isError && <p className="text-sm text-red-600">Check-in failed. Please try again.</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Checking in…" : "Check in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
