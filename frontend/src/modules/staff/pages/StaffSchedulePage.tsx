import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { StaffTabs } from "../components/StaffTabs";
import { ShiftType, staffApi } from "../api";

const SHIFT_CYCLE: (ShiftType | null)[] = [null, "MORNING", "AFTERNOON", "NIGHT"];
const SHIFT_LABEL: Record<ShiftType, string> = { MORNING: "AM", AFTERNOON: "PM", NIGHT: "Night" };
const SHIFT_COLOR: Record<ShiftType, string> = {
  MORNING: "bg-blue-100 text-blue-800",
  AFTERNOON: "bg-amber-100 text-amber-800",
  NIGHT: "bg-indigo-100 text-indigo-800",
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function StaffSchedulePage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)),
    [weekStart]
  );
  const weekEnd = days[6];

  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: staffApi.list });
  const { data: shifts } = useQuery({
    queryKey: ["staff-shifts", toDateKey(weekStart)],
    queryFn: () => staffApi.listShifts({ from: toDateKey(weekStart), to: toDateKey(weekEnd) }),
  });

  const shiftMap = useMemo(() => {
    const map = new Map<string, { id: string; shiftType: ShiftType }>();
    shifts?.forEach((s) => map.set(`${s.staffId}_${s.date.slice(0, 10)}`, s));
    return map;
  }, [shifts]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff-shifts"] });

  const upsertShift = useMutation({
    mutationFn: (vars: { staffId: string; date: string; shiftType: ShiftType }) => staffApi.upsertShift(vars),
    onSuccess: invalidate,
  });
  const deleteShift = useMutation({
    mutationFn: (id: string) => staffApi.deleteShift(id),
    onSuccess: invalidate,
  });

  function handleCellClick(staffId: string, date: Date) {
    const key = `${staffId}_${toDateKey(date)}`;
    const current = shiftMap.get(key);
    const currentIndex = SHIFT_CYCLE.indexOf(current?.shiftType ?? null);
    const next = SHIFT_CYCLE[(currentIndex + 1) % SHIFT_CYCLE.length];

    if (next === null) {
      if (current) deleteShift.mutate(current.id);
      return;
    }
    upsertShift.mutate({ staffId, date: toDateKey(date), shiftType: next });
  }

  return (
    <div>
      <StaffTabs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Schedule</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeekStart((w) => new Date(w.getTime() - 7 * 24 * 60 * 60 * 1000))}>
            ← Prev week
          </Button>
          <span className="text-sm text-slate-500">
            {weekStart.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} –{" "}
            {weekEnd.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <Button variant="secondary" onClick={() => setWeekStart((w) => new Date(w.getTime() + 7 * 24 * 60 * 60 * 1000))}>
            Next week →
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-3">Click a cell to cycle Morning → Afternoon → Night → clear.</p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 font-semibold text-slate-600">Staff</th>
                {days.map((d) => (
                  <th key={toDateKey(d)} className="text-center py-2 px-2 font-semibold text-slate-600">
                    <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div className="text-xs font-normal text-slate-400">{d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff?.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-medium">
                    {s.fullName}
                    <div className="text-xs text-slate-400 font-normal">{s.role}</div>
                  </td>
                  {days.map((d) => {
                    const shift = shiftMap.get(`${s.id}_${toDateKey(d)}`);
                    return (
                      <td key={toDateKey(d)} className="text-center px-1 py-1">
                        <button
                          onClick={() => handleCellClick(s.id, d)}
                          className={`w-full rounded-md py-1.5 text-xs font-medium transition ${
                            shift ? SHIFT_COLOR[shift.shiftType] : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {shift ? SHIFT_LABEL[shift.shiftType] : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
