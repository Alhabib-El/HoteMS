function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  return toDateStr(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

const presets = [
  { label: "Today", from: () => daysAgo(0), to: () => daysAgo(0) },
  { label: "Last 7 days", from: () => daysAgo(6), to: () => daysAgo(0) },
  { label: "Last 30 days", from: () => daysAgo(29), to: () => daysAgo(0) },
  { label: "This month", from: () => toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: () => daysAgo(0) },
];

export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
      />
      <span className="text-slate-400 text-sm">to</span>
      <input
        type="date"
        value={to}
        min={from}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
      />
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ from: p.from(), to: p.to() })}
            className="text-xs px-2 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function defaultRange() {
  return { from: daysAgo(6), to: daysAgo(0) };
}
