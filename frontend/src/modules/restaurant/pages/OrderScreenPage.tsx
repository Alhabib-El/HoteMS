import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { roomsApi } from "../../rooms/api";
import { formatMoney } from "../../../shared/utils/currency";
import { OrderItemPrepStatus, PREP_STATUS_SEQUENCE, PaymentMethod, restaurantApi } from "../api";

const prepStatusColor: Record<OrderItemPrepStatus, "slate" | "amber" | "blue" | "green"> = {
  RECEIVED: "slate",
  PREPARING: "amber",
  READY: "blue",
  SERVED: "green",
};

export function OrderScreenPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const { data: orders } = useQuery({ queryKey: ["restaurant-orders", "all"], queryFn: () => restaurantApi.listOrders(false) });
  const order = orders?.find((o) => o.id === id);

  const { data: categories } = useQuery({ queryKey: ["menu"], queryFn: restaurantApi.listCategories });
  const { data: activeBookings } = useQuery({ queryKey: ["bookings", "active"], queryFn: () => roomsApi.listBookings(true) });
  const { data: staffList } = useQuery({ queryKey: ["restaurant-staff"], queryFn: restaurantApi.listStaff });

  const activeItems = order?.items.filter((i) => !i.voided) ?? [];
  const total = activeItems.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
  const paidSoFar = order?.payments.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const remaining = Math.max(0, Math.round((total - paidSoFar) * 100) / 100);

  useEffect(() => {
    setPaymentAmount(remaining);
  }, [remaining]);

  const invalidateOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
    queryClient.invalidateQueries({ queryKey: ["menu"] });
  };

  const addItem = useMutation({
    mutationFn: (vars: { menuItemId: string; quantity: number }) => restaurantApi.addOrderItem(id!, vars),
    onSuccess: invalidateOrder,
  });

  const linkBooking = useMutation({
    mutationFn: (bookingId: string) => restaurantApi.linkBooking(id!, bookingId),
    onSuccess: invalidateOrder,
  });

  const assignStaff = useMutation({
    mutationFn: (staffId: string) => restaurantApi.assignStaff(id!, staffId),
    onSuccess: invalidateOrder,
  });

  const advanceStatus = useMutation({
    mutationFn: (vars: { itemId: string; status: OrderItemPrepStatus }) =>
      restaurantApi.updateItemStatus(id!, vars.itemId, vars.status),
    onSuccess: invalidateOrder,
  });

  const voidItem = useMutation({
    mutationFn: (vars: { itemId: string; reason: string }) => restaurantApi.voidItem(id!, vars.itemId, vars.reason),
    onSuccess: () => {
      setVoidingItemId(null);
      setVoidReason("");
      invalidateOrder();
    },
  });

  const addPayment = useMutation({
    mutationFn: () => restaurantApi.addPayment(id!, { amount: paymentAmount, method: paymentMethod }),
    onSuccess: invalidateOrder,
  });

  if (!order) return <p className="text-slate-500">Loading order…</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Order — {order.table ? `Table ${order.table.number}` : "No table"}</h1>
          <Badge color={order.status === "OPEN" ? "green" : "slate"}>{order.status}</Badge>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs font-medium text-slate-600">Waiter:</label>
          <select
            value={order.assignedStaffId ?? ""}
            onChange={(e) => e.target.value && assignStaff.mutate(e.target.value)}
            disabled={order.status !== "OPEN"}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="">— unassigned —</option>
            {staffList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        {categories?.map((cat) => (
          <div key={cat.id} className="mb-4">
            <h2 className="text-sm font-semibold text-slate-500 mb-2">{cat.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cat.items.map((item) => {
                const outOfStock = item.stockQuantity !== null && item.stockQuantity <= 0;
                return (
                  <Card key={item.id} className="flex flex-col gap-2">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatMoney(Number(item.price))}
                      {item.stockQuantity !== null && ` · stock ${item.stockQuantity}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quantities[item.id] ?? 1}
                        onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                        className="w-14 border border-slate-300 rounded-md px-1.5 py-1 text-sm"
                      />
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={order.status !== "OPEN" || outOfStock}
                        onClick={() => addItem.mutate({ menuItemId: item.id, quantity: quantities[item.id] ?? 1 })}
                      >
                        {outOfStock ? "Out of stock" : "Add"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold mb-2">Order items</h2>
          <div className="space-y-2 mb-3">
            {order.items.map((i) => (
              <div key={i.id} className={`text-sm ${i.voided ? "opacity-50" : ""}`}>
                <div className="flex justify-between">
                  <span className={i.voided ? "line-through" : ""}>
                    {i.quantity} × {i.menuItem.name}
                  </span>
                  <span className={i.voided ? "line-through" : ""}>{formatMoney(Number(i.unitPrice) * i.quantity)}</span>
                </div>
                {i.voided ? (
                  <div className="text-xs text-red-500">Voided — {i.voidReason}</div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <Badge color={prepStatusColor[i.prepStatus]}>{i.prepStatus}</Badge>
                    <div className="flex gap-2">
                      {i.prepStatus !== "SERVED" && order.status === "OPEN" && (
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() =>
                            advanceStatus.mutate({
                              itemId: i.id,
                              status: PREP_STATUS_SEQUENCE[PREP_STATUS_SEQUENCE.indexOf(i.prepStatus) + 1],
                            })
                          }
                        >
                          Advance
                        </button>
                      )}
                      {order.status === "OPEN" && (
                        <button className="text-xs text-red-600 hover:underline" onClick={() => setVoidingItemId(i.id)}>
                          Void
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {voidingItemId === i.id && (
                  <div className="flex gap-2 mt-1">
                    <input
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="Reason"
                      className="flex-1 border border-slate-300 rounded-md px-2 py-1 text-xs"
                    />
                    <Button
                      variant="danger"
                      disabled={!voidReason.trim() || voidItem.isPending}
                      onClick={() => voidItem.mutate({ itemId: i.id, reason: voidReason.trim() })}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {order.items.length === 0 && <p className="text-sm text-slate-400">No items yet</p>}
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 pt-2">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          {order.status === "OPEN" && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Charge to room (optional)</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                >
                  <option value="">— select guest —</option>
                  {activeBookings?.map((b) => (
                    <option key={b.id} value={b.id}>
                      Room {b.room?.number} — {b.guest.fullName}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  disabled={!selectedBookingId || linkBooking.isPending}
                  onClick={() => linkBooking.mutate(selectedBookingId)}
                >
                  Link
                </Button>
              </div>
              {order.bookingId && <p className="text-xs text-emerald-600 mt-1">Linked to a room booking.</p>}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Payments</h2>
          <div className="space-y-1 mb-2">
            {order.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.method}</span>
                <span>{formatMoney(Number(p.amount))}</span>
              </div>
            ))}
            {order.payments.length === 0 && <p className="text-sm text-slate-400">No payments yet</p>}
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2">
            <span>Remaining balance</span>
            <span>{formatMoney(remaining)}</span>
          </div>

          {order.status === "OPEN" && remaining > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0.01}
                  max={remaining}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="ROOM_CHARGE" disabled={!order.bookingId}>
                    Room charge
                  </option>
                </select>
              </div>
              <Button
                className="w-full"
                disabled={addPayment.isPending || paymentAmount <= 0 || activeItems.length === 0}
                onClick={() => addPayment.mutate()}
              >
                Add payment
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
