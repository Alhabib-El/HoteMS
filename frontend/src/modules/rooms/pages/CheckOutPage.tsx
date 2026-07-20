import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { roomsApi } from "../api";

export function CheckOutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: folio, isLoading } = useQuery({
    queryKey: ["folio", id],
    queryFn: () => roomsApi.getFolio(id!),
    enabled: !!id,
  });

  const checkOut = useMutation({
    mutationFn: () => roomsApi.checkOut(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/rooms");
    },
  });

  if (isLoading || !folio) return <p className="text-slate-500">Loading folio…</p>;

  const { booking } = folio;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-4">
        Folio — Room {booking.room?.number} (key {booking.room?.keyNumber}), {booking.guest.fullName}
      </h1>

      <Card>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Status</span>
          <div className="flex items-center gap-2">
            {booking.isShortStay && <Badge color="amber">Short stay</Badge>}
            <Badge color={booking.status === "CHECKED_IN" ? "red" : "slate"}>{booking.status}</Badge>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">
            {booking.isShortStay ? "Short-stay room charge" : `Room charge (${folio.nights} night(s))`}
          </span>
          <span>{formatMoney(folio.roomTotal)}</span>
        </div>

        {booking.folioCharges?.length ? (
          <div className="mt-3 border-t border-slate-200 pt-2">
            <div className="text-xs font-semibold text-slate-500 mb-1">Additional charges</div>
            {booking.folioCharges.map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span>
                  {c.description} <span className="text-xs text-slate-400">({c.sourceModule})</span>
                </span>
                <span>{formatMoney(Number(c.amount))}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex justify-between font-bold text-lg mt-3 border-t border-slate-200 pt-2">
          <span>Total</span>
          <span>{formatMoney(folio.grandTotal)}</span>
        </div>
      </Card>

      {booking.status === "CHECKED_IN" && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => checkOut.mutate()} disabled={checkOut.isPending}>
            {checkOut.isPending ? "Checking out…" : "Confirm check-out"}
          </Button>
        </div>
      )}
    </div>
  );
}
