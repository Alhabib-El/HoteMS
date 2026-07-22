import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/rooms", label: "Overview", end: true },
  { to: "/rooms/bookings", label: "Bookings" },
  { to: "/rooms/housekeeping", label: "Housekeeping" },
  { to: "/rooms/manage", label: "Manage" },
];

export function RoomsTabs() {
  return (
    <div className="flex gap-6 border-b border-slate-200 mb-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `pb-2 text-sm font-semibold uppercase tracking-wide border-b-2 -mb-px ${
              isActive ? "border-rooms text-rooms" : "border-transparent text-slate-400 hover:text-slate-600"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
