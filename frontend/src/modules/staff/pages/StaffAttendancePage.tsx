import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Card } from "../../../shared/components/Card";
import { StaffTabs } from "../components/StaffTabs";
import { staffApi } from "../api";

function hoursWorked(clockInAt: string, clockOutAt: string | null) {
  if (!clockOutAt) return null;
  return (new Date(clockOutAt).getTime() - new Date(clockInAt).getTime()) / (1000 * 60 * 60);
}

export function StaffAttendancePage() {
  const [staffId, setStaffId] = useState("");
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: staffApi.list });
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["staff-attendance", staffId],
    queryFn: () => staffApi.listAttendance(staffId ? { staffId } : {}),
  });

  return (
    <div>
      <StaffTabs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Attendance</h1>
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        >
          <option value="">All staff</option>
          {staff?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading attendance…</p>}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3 font-semibold">Staff</th>
              <th className="py-2 pr-3 font-semibold">Clock in</th>
              <th className="py-2 pr-3 font-semibold">Clock out</th>
              <th className="py-2 pr-3 font-semibold">Hours</th>
              <th className="py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance?.map((a) => {
              const hours = hoursWorked(a.clockInAt, a.clockOutAt);
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{a.staff?.fullName ?? "—"}</td>
                  <td className="py-2 pr-3">{new Date(a.clockInAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">{a.clockOutAt ? new Date(a.clockOutAt).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-3">{hours !== null ? `${hours.toFixed(1)}h` : "—"}</td>
                  <td className="py-2">
                    {a.clockOutAt ? <Badge color="slate">Complete</Badge> : <Badge color="green">Clocked in</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {attendance?.length === 0 && <p className="text-sm text-slate-400 mt-2">No attendance records.</p>}
      </Card>
    </div>
  );
}
