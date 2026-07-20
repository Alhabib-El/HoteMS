import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../../shared/components/Badge";
import { Card, StatCard } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { reportingApi } from "../api";

export function DashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["reporting-summary"], queryFn: reportingApi.getSummary });
  const { data: revenueByDay } = useQuery({
    queryKey: ["reporting-revenue"],
    queryFn: () => reportingApi.getRevenueByDay(),
  });
  const { data: lowStock } = useQuery({ queryKey: ["reporting-low-stock"], queryFn: reportingApi.getLowStock });

  const seeRoom = summary?.revenue.room !== null && summary?.revenue.room !== undefined;
  const seeRestaurant = summary?.revenue.restaurant !== null && summary?.revenue.restaurant !== undefined;
  const seeLiquor = summary?.liquor.wholesaleValue !== null && summary?.liquor.wholesaleValue !== undefined;
  const seeTotal = summary?.revenue.total !== null && summary?.revenue.total !== undefined;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Reporting dashboard</h1>

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
          <StatCard label="Occupancy" value={`${summary.occupancy.rate.toFixed(0)}%`} />
          <StatCard label="Rooms occupied" value={`${summary.occupancy.occupied} / ${summary.occupancy.totalRooms}`} />
        </div>
      )}

      {(seeLiquor || seeRestaurant) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {seeLiquor && (
            <StatCard label="Liquor low stock alerts" value={`${summary?.liquor.lowStockCount ?? 0}`} valueClassName="text-red-600" />
          )}
          {seeRestaurant && (
            <StatCard label="Bar low stock alerts" value={`${summary?.lowStock.restaurant ?? 0}`} valueClassName="text-red-600" />
          )}
        </div>
      )}

      {(seeRoom || seeRestaurant) && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-3">Revenue — last 7 days</h2>
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
        <Card>
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
    </div>
  );
}
