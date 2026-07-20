export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, valueClassName = "text-slate-800" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</div>
    </Card>
  );
}
