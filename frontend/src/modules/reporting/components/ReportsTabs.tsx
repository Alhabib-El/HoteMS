import { NavLink } from "react-router-dom";
import { useAuth } from "../../../shared/auth/AuthContext";
import { StaffRole } from "../../../shared/auth/authApi";

const tabs: { to: string; label: string; end?: boolean; roles?: StaffRole[] }[] = [
  { to: "/reporting", label: "Overview", end: true },
  { to: "/reporting/occupancy", label: "Occupancy", roles: ["ROOMS"] },
  { to: "/reporting/restaurant", label: "Restaurant", roles: ["RESTAURANT"] },
  { to: "/reporting/liquor", label: "Liquor", roles: ["LIQUOR"] },
  { to: "/reporting/labor", label: "Labor", roles: ["MANAGEMENT"] },
];

export function ReportsTabs() {
  const { staff } = useAuth();
  const visible = tabs.filter((t) => !t.roles || staff?.role === "MANAGEMENT" || t.roles.includes(staff!.role));

  return (
    <div className="flex gap-6 border-b border-slate-200 mb-4">
      {visible.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `pb-2 text-sm font-semibold uppercase tracking-wide border-b-2 -mb-px ${
              isActive ? "border-reporting text-reporting" : "border-transparent text-slate-400 hover:text-slate-600"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
