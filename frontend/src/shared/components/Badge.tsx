export function Badge({ color, children }: { color: "green" | "red" | "amber" | "slate" | "blue"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-200 text-slate-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
  );
}
