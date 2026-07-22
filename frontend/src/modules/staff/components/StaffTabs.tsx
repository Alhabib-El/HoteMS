import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/staff", label: "Directory", end: true },
  { to: "/staff/schedule", label: "Schedule" },
  { to: "/staff/attendance", label: "Attendance" },
  { to: "/staff/leave", label: "Leave" },
];

export function StaffTabs() {
  return (
    <div className="flex gap-6 border-b border-slate-200 mb-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `pb-2 text-sm font-semibold uppercase tracking-wide border-b-2 -mb-px ${
              isActive ? "border-slate-700 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
