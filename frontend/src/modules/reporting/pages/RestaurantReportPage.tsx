import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../../shared/components/Badge";
import { Card, StatCard } from "../../../shared/components/Card";
import { DateRangePicker, defaultRange } from "../../../shared/components/DateRangePicker";
import { formatMoney } from "../../../shared/utils/currency";
import { ReportsTabs } from "../components/ReportsTabs";
import { reportingApi } from "../api";

export function RestaurantReportPage() {
  const [range, setRange] = useState(defaultRange());

  const { data: sales } = useQuery({
    queryKey: ["restaurant-sales-report", range],
    queryFn: () => reportingApi.getRestaurantSalesReport(range.from, range.to),
  });
  const { data: voidReport } = useQuery({
    queryKey: ["void-report", range],
    queryFn: () => reportingApi.getVoidReport(range.from, range.to),
  });

  return (
    <div>
      <ReportsTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Restaurant sales</h1>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue" value={formatMoney(sales?.totalRevenue ?? 0)} valueClassName="text-emerald-700" />
        <StatCard label="Paid orders" value={`${sales?.orderCount ?? 0}`} />
        <StatCard label="Avg order value" value={formatMoney(sales?.averageOrderValue ?? 0)} />
        <StatCard label="Value voided" value={formatMoney(voidReport?.totalValueVoided ?? 0)} valueClassName="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="font-semibold mb-3">Sales by category</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={sales?.salesByCategory ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="revenue" fill="#d97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Payment methods</h2>
          <div className="space-y-2">
            {sales?.paymentsByMethod.map((p) => (
              <div key={p.method} className="flex justify-between text-sm">
                <span>{p.method.replace("_", " ")}</span>
                <span className="font-medium">{formatMoney(p.amount)}</span>
              </div>
            ))}
            {sales?.paymentsByMethod.length === 0 && <p className="text-sm text-slate-400">No payments in this period.</p>}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3">Top-selling items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3 font-semibold">Item</th>
              <th className="py-2 pr-3 font-semibold">Qty sold</th>
              <th className="py-2 font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {sales?.topItems.map((item) => (
              <tr key={item.name} className="border-t border-slate-100">
                <td className="py-2 pr-3">{item.name}</td>
                <td className="py-2 pr-3">{item.quantity}</td>
                <td className="py-2">{formatMoney(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales?.topItems.length === 0 && <p className="text-sm text-slate-400">No sales in this period.</p>}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Void report</h2>
        {voidReport?.items.length === 0 && <p className="text-sm text-slate-400">No voided items in this period.</p>}
        <div className="space-y-2">
          {voidReport?.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
              <div>
                <span>
                  {i.quantity} × {i.menuItem.name}
                </span>
                <div className="text-xs text-slate-400">{i.voidReason}</div>
              </div>
              <div className="text-right">
                <Badge color="red">{formatMoney(Number(i.unitPrice) * i.quantity)}</Badge>
                <div className="text-xs text-slate-400 mt-1">{i.voidedAt && new Date(i.voidedAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
