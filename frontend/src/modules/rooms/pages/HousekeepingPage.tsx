import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { RoomsTabs } from "../components/RoomsTabs";
import { HousekeepingStatus, roomsApi } from "../api";

const OPTIONS: { value: HousekeepingStatus; label: string }[] = [
  { value: "NOT_CLEAN", label: "Not clean" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CLEAN", label: "Clean" },
  { value: "REPAIR", label: "Needs repair" },
];

const badgeColor: Record<HousekeepingStatus, "green" | "red" | "amber" | "slate"> = {
  CLEAN: "green",
  NOT_CLEAN: "red",
  IN_PROGRESS: "amber",
  REPAIR: "slate",
};

export function HousekeepingPage() {
  const queryClient = useQueryClient();
  const { data: rooms, isLoading } = useQuery({ queryKey: ["rooms"], queryFn: roomsApi.listRooms });

  const setHousekeeping = useMutation({
    mutationFn: (vars: { roomId: string; housekeeping: HousekeepingStatus }) =>
      roomsApi.setHousekeeping(vars.roomId, vars.housekeeping),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const workableRooms = rooms?.filter((r) => r.status !== "OCCUPIED") ?? [];
  const occupiedRooms = rooms?.filter((r) => r.status === "OCCUPIED") ?? [];

  return (
    <div>
      <RoomsTabs />
      <h1 className="text-xl font-bold mb-4">Housekeeping</h1>

      {isLoading && <p className="text-slate-500">Loading rooms…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workableRooms.map((room) => (
          <Card key={room.id}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold text-sm">Room {room.number}</div>
                <div className="text-xs text-slate-500">{room.roomType.name}</div>
              </div>
              <Badge color={badgeColor[room.housekeeping]}>{room.housekeeping.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={room.housekeeping === opt.value ? "primary" : "secondary"}
                  disabled={room.housekeeping === opt.value || setHousekeeping.isPending}
                  onClick={() => setHousekeeping.mutate({ roomId: room.id, housekeeping: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {occupiedRooms.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-500 mt-6 mb-2">Occupied (housekeeping locked until checkout)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {occupiedRooms.map((room) => (
              <Card key={room.id} className="opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">Room {room.number}</div>
                    <div className="text-xs text-slate-500">{room.roomType.name}</div>
                  </div>
                  <Badge color="red">Occupied</Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
