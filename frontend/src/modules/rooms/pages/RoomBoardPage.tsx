import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckInForm } from "../components/CheckInForm";
import { RoomCard } from "../components/RoomCard";
import { RoomsTabs } from "../components/RoomsTabs";
import { HousekeepingStatus, Room, RoomStatus, roomsApi } from "../api";

const STATUSES: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"];
const STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
};

const HOUSEKEEPING: HousekeepingStatus[] = ["CLEAN", "NOT_CLEAN", "IN_PROGRESS", "REPAIR"];
const HOUSEKEEPING_LABEL: Record<HousekeepingStatus, string> = {
  CLEAN: "Clean",
  NOT_CLEAN: "Not clean",
  IN_PROGRESS: "In progress",
  REPAIR: "Repair",
};

function FilterGroup<T extends string>({
  title,
  options,
  labels,
  counts,
  selected,
  onToggle,
}: {
  title: string;
  options: T[];
  labels: Record<T, string>;
  counts: Record<string, number>;
  selected: Set<T>;
  onToggle: (value: T) => void;
}) {
  return (
    <div className="mb-5">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{title}</div>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center justify-between text-sm cursor-pointer">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={selected.has(opt)} onChange={() => onToggle(opt)} />
              {labels[opt]}
            </span>
            <span className="text-slate-400">{counts[opt] ?? 0}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function RoomBoardPage() {
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useQuery({ queryKey: ["rooms"], queryFn: roomsApi.listRooms });
  const [checkInRoom, setCheckInRoom] = useState<Room | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set<RoomStatus>(STATUSES));
  const [typeFilter, setTypeFilter] = useState<Set<string> | null>(null);
  const [housekeepingFilter, setHousekeepingFilter] = useState(new Set<HousekeepingStatus>(HOUSEKEEPING));

  const roomTypes = useMemo(() => {
    const map = new Map<string, string>();
    rooms?.forEach((r) => map.set(r.roomTypeId, r.roomType.name));
    return Array.from(map.entries());
  }, [rooms]);

  const activeTypeFilter = typeFilter ?? new Set(roomTypes.map(([id]) => id));

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms?.forEach((r) => (counts[r.status] = (counts[r.status] ?? 0) + 1));
    return counts;
  }, [rooms]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms?.forEach((r) => (counts[r.roomTypeId] = (counts[r.roomTypeId] ?? 0) + 1));
    return counts;
  }, [rooms]);

  const housekeepingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms?.forEach((r) => (counts[r.housekeeping] = (counts[r.housekeeping] ?? 0) + 1));
    return counts;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rooms ?? []).filter((r) => {
      if (!statusFilter.has(r.status)) return false;
      if (!activeTypeFilter.has(r.roomTypeId)) return false;
      if (!housekeepingFilter.has(r.housekeeping)) return false;
      if (q) {
        const guestName = r.bookings?.[0]?.guest.fullName.toLowerCase() ?? "";
        if (!r.number.toLowerCase().includes(q) && !guestName.includes(q)) return false;
      }
      return true;
    });
  }, [rooms, statusFilter, activeTypeFilter, housekeepingFilter, search]);

  const groupedByType = useMemo(() => {
    const groups = new Map<string, { name: string; rooms: Room[] }>();
    for (const room of filteredRooms) {
      const g = groups.get(room.roomTypeId) ?? { name: room.roomType.name, rooms: [] };
      g.rooms.push(room);
      groups.set(room.roomTypeId, g);
    }
    return Array.from(groups.values());
  }, [filteredRooms]);

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function handleRoomClick(room: Room) {
    if (room.status === "AVAILABLE") {
      setCheckInRoom(room);
      return;
    }
    if (room.status === "OCCUPIED" && room.bookings?.[0]) {
      navigate(`/rooms/bookings/${room.bookings[0].id}/checkout`);
    }
  }

  return (
    <div>
      <RoomsTabs />

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })} · Today
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by room # or guest name"
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-72"
        />
      </div>

      {isLoading && <p className="text-slate-500">Loading rooms…</p>}

      <div className="flex gap-6 items-start">
        <aside className="w-48 shrink-0">
          <FilterGroup
            title="Status"
            options={STATUSES}
            labels={STATUS_LABEL}
            counts={statusCounts}
            selected={statusFilter}
            onToggle={(v) => toggle(statusFilter, v, setStatusFilter)}
          />
          <FilterGroup
            title="Type"
            options={roomTypes.map(([id]) => id)}
            labels={Object.fromEntries(roomTypes) as Record<string, string>}
            counts={typeCounts}
            selected={activeTypeFilter}
            onToggle={(v) => toggle(activeTypeFilter, v, setTypeFilter)}
          />
          <FilterGroup
            title="Housekeeping"
            options={HOUSEKEEPING}
            labels={HOUSEKEEPING_LABEL}
            counts={housekeepingCounts}
            selected={housekeepingFilter}
            onToggle={(v) => toggle(housekeepingFilter, v, setHousekeepingFilter)}
          />
        </aside>

        <div className="flex-1 min-w-0">
          {groupedByType.map((group) => (
            <div key={group.name} className="mb-6">
              <h2 className="text-sm font-bold text-slate-700 mb-2">{group.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.rooms.map((room) => (
                  <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
                ))}
              </div>
            </div>
          ))}
          {!isLoading && filteredRooms.length === 0 && <p className="text-slate-400 text-sm">No rooms match these filters.</p>}
        </div>
      </div>

      {checkInRoom && <CheckInForm room={checkInRoom} onClose={() => setCheckInRoom(null)} />}
    </div>
  );
}
