import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../../shared/components/Badge";
import { Card, StatCard } from "../../../shared/components/Card";
import { DateRangePicker, defaultRange } from "../../../shared/components/DateRangePicker";
import { formatMoney } from "../../../shared/utils/currency";
import { ReportsTabs } from "../components/ReportsTabs";
import { BookingRef, reportingApi } from "../api";

function BookingTable({ rows, dateField }: { rows: BookingRef[]; dateField: "checkInAt" | "checkOutAt" }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500">
          <th className="py-2 pr-3 font-semibold">Guest</th>
          <th className="py-2 pr-3 font-semibold">Room</th>
          <th className="py-2 pr-3 font-semibold">Date</th>
          <th className="py-2 font-semibold">Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => (
          <tr key={b.id} className="border-t border-slate-100">
            <td className="py-2 pr-3">
              {b.guest.fullName}
              {b.isShortStay && <Badge color="amber">Short stay</Badge>}
            </td>
            <td className="py-2 pr-3">
              {b.room?.number} <span className="text-xs text-slate-400">({b.room?.roomType.name})</span>
            </td>
            <td className="py-2 pr-3">{new Date(b[dateField]!).toLocaleString()}</td>
            <td className="py-2">{formatMoney(Number(b.ratePerNight))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OccupancyReportPage() {
  const [range, setRange] = useState(defaultRange());

  const { data: trend } = useQuery({
    queryKey: ["occupancy-trend", range],
    queryFn: () => reportingApi.getOccupancyTrend(range.from, range.to),
  });
  const { data: arrDep } = useQuery({
    queryKey: ["arrivals-departures", range],
    queryFn: () => reportingApi.getArrivalsDepartures(range.from, range.to),
  });

  return (
    <div>
      <ReportsTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Occupancy</h1>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg length of stay" value={arrDep ? `${arrDep.avgLengthOfStay.toFixed(1)} nights` : "—"} />
        <StatCard label="Overnight departures" value={`${arrDep?.overnightCount ?? 0}`} />
        <StatCard label="Short-stay departures" value={`${arrDep?.shortStayCount ?? 0}`} valueClassName="text-amber-600" />
        <StatCard label="Arrivals" value={`${arrDep?.arrivals.length ?? 0}`} />
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3">Occupancy trend</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} />
              <Line type="monotone" dataKey="rate" name="Occupancy" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-3">Arrivals</h2>
          {arrDep?.arrivals.length === 0 && <p className="text-sm text-slate-400">No arrivals in this period.</p>}
          {arrDep && <BookingTable rows={arrDep.arrivals} dateField="checkInAt" />}
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Departures</h2>
          {arrDep?.departures.length === 0 && <p className="text-sm text-slate-400">No departures in this period.</p>}
          {arrDep && <BookingTable rows={arrDep.departures} dateField="checkOutAt" />}
        </Card>
      </div>
    </div>
  );
}
