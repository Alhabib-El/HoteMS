import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { RoomsTabs } from "../components/RoomsTabs";
import { roomsApi } from "../api";

export function BookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "active"],
    queryFn: () => roomsApi.listBookings(true),
  });

  return (
    <div>
      <RoomsTabs />
      <h1 className="text-xl font-bold mb-4">Active bookings</h1>
      {isLoading && <p className="text-slate-500">Loading…</p>}
      {bookings?.length === 0 && <p className="text-slate-500">No guests currently checked in.</p>}

      <div className="space-y-3">
        {bookings?.map((b) => (
          <Card key={b.id} className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {b.guest.fullName} — Room {b.room?.number}
                <span className="text-xs text-slate-400 font-normal"> (key {b.room?.keyNumber})</span>
              </div>
              <div className="text-xs text-slate-500">
                Checked in {new Date(b.checkInAt).toLocaleString()} · Expected out{" "}
                {new Date(b.expectedCheckOutAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {b.isShortStay && <Badge color="amber">Short stay</Badge>}
              <Badge color="red">{b.status}</Badge>
              <Link to={`/rooms/bookings/${b.id}/checkout`} className="text-sm font-medium text-blue-600 hover:underline">
                View folio
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
