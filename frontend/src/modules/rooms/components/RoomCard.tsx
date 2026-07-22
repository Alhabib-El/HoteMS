import { Room, RoomStatus } from "../api";

const headerClasses: Record<RoomStatus, string> = {
  AVAILABLE: "bg-white text-slate-900 border border-slate-200",
  OCCUPIED: "bg-indigo-600 text-white",
  CLEANING: "bg-amber-500 text-white",
  MAINTENANCE: "bg-slate-500 text-white",
};

const statusLabel: Record<RoomStatus, string> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  CLEANING: "cleaning",
  MAINTENANCE: "maintenance",
};

const avatarColors = ["bg-orange-400", "bg-sky-500", "bg-emerald-500", "bg-fuchsia-500", "bg-rose-400"];

function avatarColorFor(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function nightsSince(checkInAt: string) {
  const days = Math.floor((Date.now() - new Date(checkInAt).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function RoomCard({ room, onClick }: { room: Room; onClick?: () => void }) {
  const activeBooking = room.bookings?.[0];
  const isClean = room.housekeeping === "CLEAN";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition bg-white"
    >
      <div className={`flex items-center justify-between px-3 py-2 ${headerClasses[room.status]}`}>
        <span className="font-bold text-sm">Room {room.number}</span>
        <span className="text-xs opacity-90">{statusLabel[room.status]}</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-3">
        {activeBooking ? (
          <>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColorFor(
                activeBooking.guest.fullName
              )}`}
            >
              {initials(activeBooking.guest.fullName)}
            </div>
            <span className="text-sm font-medium text-slate-800 truncate">{activeBooking.guest.fullName}</span>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 text-sky-500 flex items-center justify-center shrink-0">
              ✓
            </div>
            <span className="text-sm font-medium text-slate-500">Free Room</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 px-3 pb-2 text-xs text-slate-500">
        {activeBooking && <span>{nightsSince(activeBooking.checkInAt)} days</span>}
        <span className={isClean ? "text-emerald-600" : "text-red-500"}>
          {isClean ? "✓ clean" : room.housekeeping === "IN_PROGRESS" ? "⏳ cleaning" : room.housekeeping === "REPAIR" ? "🔧 repair" : "✕ not clean"}
        </span>
      </div>
    </button>
  );
}
