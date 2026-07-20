import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { CheckInForm } from "../components/CheckInForm";
import { Room, RoomStatus, roomsApi } from "../api";

const statusColor: Record<RoomStatus, "green" | "red" | "amber" | "slate"> = {
  AVAILABLE: "green",
  OCCUPIED: "red",
  CLEANING: "amber",
  MAINTENANCE: "slate",
};

export function RoomBoardPage() {
  const { data: rooms, isLoading } = useQuery({ queryKey: ["rooms"], queryFn: roomsApi.listRooms });
  const [checkInRoom, setCheckInRoom] = useState<Room | null>(null);
  const queryClient = useQueryClient();

  const markAvailable = useMutation({
    mutationFn: (roomId: string) => roomsApi.setRoomStatus(roomId, "AVAILABLE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Room status board</h1>
        <div className="flex gap-2">
          <Link to="/rooms/manage">
            <Button variant="secondary">Manage rooms</Button>
          </Link>
          <Link to="/rooms/bookings">
            <Button variant="secondary">Active bookings</Button>
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-slate-500">Loading rooms…</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms?.map((room) => {
          const activeBooking = room.bookings?.[0];
          return (
            <Card key={room.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold">{room.number}</div>
                  <div className="text-xs text-slate-500">
                    {room.roomType.name} · Key {room.keyNumber}
                  </div>
                </div>
                <Badge color={statusColor[room.status]}>{room.status}</Badge>
              </div>

              {activeBooking && (
                <p className="text-sm text-slate-600 mt-2 truncate">
                  Guest: {activeBooking.guest.fullName}
                  {activeBooking.isShortStay && (
                    <span className="ml-1 text-xs text-amber-600 font-medium">(short stay)</span>
                  )}
                </p>
              )}

              <div className="mt-3">
                {room.status === "AVAILABLE" && (
                  <Button className="w-full" onClick={() => setCheckInRoom(room)}>
                    Check in
                  </Button>
                )}
                {room.status === "OCCUPIED" && activeBooking && (
                  <Link to={`/rooms/bookings/${activeBooking.id}/checkout`}>
                    <Button variant="secondary" className="w-full">
                      View / check out
                    </Button>
                  </Link>
                )}
                {(room.status === "CLEANING" || room.status === "MAINTENANCE") && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={markAvailable.isPending}
                    onClick={() => markAvailable.mutate(room.id)}
                  >
                    Mark available
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {checkInRoom && <CheckInForm room={checkInRoom} onClose={() => setCheckInRoom(null)} />}
    </div>
  );
}
