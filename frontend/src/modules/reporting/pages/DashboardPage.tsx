import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card, StatCard } from "../../../shared/components/Card";
import { DateRangePicker, defaultRange } from "../../../shared/components/DateRangePicker";
import { formatMoney } from "../../../shared/utils/currency";
import { ReportsTabs } from "../components/ReportsTabs";
import { reportingApi } from "../api";

export function DashboardPage() {
  const [range, setRange] = useState(defaultRange());
  const [downloading, setDownloading] = useState(false);

  const { data: summary } = useQuery({ queryKey: ["reporting-summary"], queryFn: reportingApi.getSummary });
  const { data: kpis } = useQuery({
    queryKey: ["reporting-kpis", range],
    queryFn: () => reportingApi.getKpis(range.from, range.to),
  });
  const { data: revenueByDay } = useQuery({
    queryKey: ["reporting-revenue", range],
    queryFn: () => reportingApi.getRevenueByDay(range.from, range.to),
  });
  const { data: lowStock } = useQuery({ queryKey: ["reporting-low-stock"], queryFn: reportingApi.getLowStock });

  const seeRoom = summary?.revenue.room !== null && summary?.revenue.room !== undefined;
  const seeRestaurant = summary?.revenue.restaurant !== null && summary?.revenue.restaurant !== undefined;
  const seeLiquor = summary?.liquor.wholesaleValue !== null && summary?.liquor.wholesaleValue !== undefined;
  const seeTotal = summary?.revenue.total !== null && summary?.revenue.total !== undefined;

  async function handleExport() {
    setDownloading(true);
    try {
      await reportingApi.downloadRevenueCsv(range.from, range.to);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <ReportsTabs />
      <h1 className="text-xl font-bold mb-4">Reporting overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {seeTotal && <StatCard label="Today's revenue" value={formatMoney(summary!.revenue.total!)} valueClassName="text-emerald-700" />}
        {seeRoom && <StatCard label="Room revenue" value={formatMoney(summary!.revenue.room!)} valueClassName="text-rooms" />}
        {seeRestaurant && (
          <StatCard label="Restaurant revenue" value={formatMoney(summary!.revenue.restaurant!)} valueClassName="text-restaurant" />
        )}
        {seeLiquor && (
          <StatCard
            label="Liquor stock shipped (wholesale)"
            value={formatMoney(summary!.liquor.wholesaleValue!)}
            valueClassName="text-liquor"
          />
        )}
      </div>
      {seeLiquor && (
        <p className="text-xs text-slate-400 -mt-4 mb-6">
          Liquor stores are wholesale suppliers to the restaurant's bar, not a guest-facing revenue source — this figure isn't included
          in the totals above.
        </p>
      )}

      {summary?.occupancy && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Occupancy (now)" value={`${summary.occupancy.rate.toFixed(0)}%`} />
          <StatCard label="Rooms occupied" value={`${summary.occupancy.occupied} / ${summary.occupancy.totalRooms}`} />
        </div>
      )}

      {(seeLiquor || seeRestaurant || seeRoom) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {seeLiquor && (
            <StatCard label="Liquor low stock alerts" value={`${summary?.liquor.lowStockCount ?? 0}`} valueClassName="text-red-600" />
          )}
          {seeRestaurant && (
            <StatCard label="Bar low stock alerts" value={`${summary?.lowStock.restaurant ?? 0}`} valueClassName="text-red-600" />
          )}
          {seeRestaurant && (
            <StatCard label="Ingredient low stock" value={`${summary?.lowStock.ingredients ?? 0}`} valueClassName="text-red-600" />
          )}
          {seeRoom && (
            <StatCard label="Room supply low stock" value={`${summary?.lowStock.roomSupplies ?? 0}`} valueClassName="text-red-600" />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold">Trends</h2>
        <div className="flex items-center gap-3">
          <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
          <Button variant="secondary" onClick={handleExport} disabled={downloading}>
            {downloading ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      {(seeRoom || seeRestaurant) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {seeRoom && <StatCard label="ADR (avg daily rate)" value={kpis?.adr != null ? formatMoney(kpis.adr) : "—"} />}
          {seeRoom && <StatCard label="RevPAR" value={kpis?.revPar != null ? formatMoney(kpis.revPar) : "—"} />}
          {seeRoom && (
            <StatCard label="Avg occupancy" value={kpis?.avgOccupancy != null ? `${kpis.avgOccupancy.toFixed(0)}%` : "—"} />
          )}
          {seeTotal && kpis?.revenue.total != null && (
            <StatCard label="Period revenue" value={formatMoney(kpis.revenue.total)} valueClassName="text-emerald-700" />
          )}
        </div>
      )}

      {(seeRoom || seeRestaurant) && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3">Revenue by day</h2>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={revenueByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Legend />
                {seeRoom && <Bar dataKey="room" name="Rooms" fill="#2563eb" />}
                {seeRestaurant && <Bar dataKey="restaurant" name="Restaurant" fill="#d97706" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {seeLiquor && lowStock?.liquor && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3">Liquor store low stock</h2>
          {lowStock.liquor.length === 0 && <p className="text-sm text-slate-400">All stock levels are healthy.</p>}
          <div className="space-y-2">
            {lowStock.liquor.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {p.name} <span className="text-xs text-slate-400">({p.store.name})</span>
                </span>
                <Badge color="red">
                  {p.stockQuantity} left (threshold {p.lowStockThreshold})
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {seeRestaurant && lowStock?.restaurant && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3">Restaurant bar low stock</h2>
          {lowStock.restaurant.length === 0 && <p className="text-sm text-slate-400">All stock levels are healthy.</p>}
          <div className="space-y-2">
            {lowStock.restaurant.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {p.name} <span className="text-xs text-slate-400">({p.category.name})</span>
                </span>
                <Badge color="red">
                  {p.stockQuantity} left (threshold {p.lowStockThreshold})
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {seeRestaurant && lowStock?.ingredients && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3">Kitchen ingredient low stock</h2>
          {lowStock.ingredients.length === 0 && <p className="text-sm text-slate-400">All stock levels are healthy.</p>}
          <div className="space-y-2">
            {lowStock.ingredients.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <span>
                  {i.name} <span className="text-xs text-slate-400">({i.category.toLowerCase()})</span>
                </span>
                <Badge color="red">
                  {Number(i.stockQuantity)} {i.unit} left (threshold {Number(i.lowStockThreshold)})
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {seeRoom && lowStock?.roomSupplies && (
        <Card>
          <h2 className="font-semibold mb-3">Room supply low stock</h2>
          {lowStock.roomSupplies.length === 0 && <p className="text-sm text-slate-400">All stock levels are healthy.</p>}
          <div className="space-y-2">
            {lowStock.roomSupplies.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>
                  {s.name} <span className="text-xs text-slate-400">({s.category.toLowerCase()})</span>
                </span>
                <Badge color="red">
                  {s.stockQuantity} {s.unit} left (threshold {s.lowStockThreshold})
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
