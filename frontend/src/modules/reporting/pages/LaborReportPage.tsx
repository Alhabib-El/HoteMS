import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Card, StatCard } from "../../../shared/components/Card";
import { DateRangePicker, defaultRange } from "../../../shared/components/DateRangePicker";
import { ReportsTabs } from "../components/ReportsTabs";
import { reportingApi } from "../api";

export function LaborReportPage() {
  const [range, setRange] = useState(defaultRange());

  const { data: report } = useQuery({
    queryKey: ["labor-report", range],
    queryFn: () => reportingApi.getLaborReport(range.from, range.to),
  });

  return (
    <div>
      <ReportsTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Labor</h1>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total hours worked" value={`${(report?.totalHours ?? 0).toFixed(1)}h`} />
        <StatCard label="Staff with hours logged" value={`${report?.staffHours.length ?? 0}`} />
        <StatCard label="Currently clocked in" value={`${report?.openShiftsCount ?? 0}`} valueClassName="text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-3">Hours worked by staff</h2>
          {report?.staffHours.length === 0 && <p className="text-sm text-slate-400">No completed shifts in this period.</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3 font-semibold">Staff</th>
                <th className="py-2 font-semibold">Hours</th>
              </tr>
            </thead>
            <tbody>
              {report?.staffHours.map((s) => (
                <tr key={s.staffId} className="border-t border-slate-100">
                  <td className="py-2 pr-3">
                    {s.fullName} <span className="text-xs text-slate-400">({s.role})</span>
                  </td>
                  <td className="py-2">{s.hours.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Upcoming approved leave</h2>
          {report?.upcomingLeave.length === 0 && <p className="text-sm text-slate-400">No upcoming leave scheduled.</p>}
          <div className="space-y-2">
            {report?.upcomingLeave.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span>
                  {l.staff.fullName} <span className="text-xs text-slate-400">({l.leaveType})</span>
                </span>
                <Badge color="amber">
                  {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
