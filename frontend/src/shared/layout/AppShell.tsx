import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StaffRole } from "../auth/authApi";

const navItems: { to: string; label: string; accent: string; roles?: StaffRole[] }[] = [
  { to: "/rooms", label: "Rooms", accent: "border-rooms text-rooms", roles: ["ROOMS"] },
  { to: "/restaurant", label: "Restaurant", accent: "border-restaurant text-restaurant", roles: ["RESTAURANT"] },
  { to: "/liquor", label: "Liquor Stores", accent: "border-liquor text-liquor", roles: ["LIQUOR"] },
  { to: "/reporting", label: "Reporting", accent: "border-reporting text-reporting" },
  { to: "/staff", label: "Staff", accent: "border-slate-400 text-slate-200", roles: ["MANAGEMENT"] },
];

export function AppShell() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(
    (item) => !item.roles || staff?.role === "MANAGEMENT" || item.roles.includes(staff!.role)
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="px-4 py-5 text-lg font-bold border-b border-slate-700">HoteMS</div>
        <nav className="flex-1 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm font-medium border-l-4 ${
                  isActive
                    ? `bg-slate-800 ${item.accent}`
                    : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 text-xs border-t border-slate-700">
          <div className="text-slate-300 font-medium truncate">{staff?.fullName}</div>
          <div className="text-slate-500 mb-2">{staff?.role}</div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white underline">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}
