import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, StatCard } from "../../../shared/components/Card";
import { DateRangePicker, defaultRange } from "../../../shared/components/DateRangePicker";
import { formatMoney } from "../../../shared/utils/currency";
import { ReportsTabs } from "../components/ReportsTabs";
import { reportingApi } from "../api";

export function LiquorReportPage() {
  const [range, setRange] = useState(defaultRange());

  const { data: report } = useQuery({
    queryKey: ["liquor-report", range],
    queryFn: () => reportingApi.getLiquorReport(range.from, range.to),
  });

  return (
    <div>
      <ReportsTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Liquor stores</h1>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Wholesale value shipped" value={formatMoney(report?.totalWholesaleValue ?? 0)} valueClassName="text-liquor" />
        <StatCard label="Retail value (to restaurant)" value={formatMoney(report?.totalRetailValue ?? 0)} />
        <StatCard label="Transfers" value={`${report?.transfers.length ?? 0}`} />
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3">Current stock valuation</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3 font-semibold">Store</th>
              <th className="py-2 pr-3 font-semibold">At cost</th>
              <th className="py-2 font-semibold">At wholesale price</th>
            </tr>
          </thead>
          <tbody>
            {report?.stockValuation.map((s) => (
              <tr key={s.storeId} className="border-t border-slate-100">
                <td className="py-2 pr-3">{s.storeName}</td>
                <td className="py-2 pr-3">{formatMoney(s.valuationAtCost)}</td>
                <td className="py-2">{formatMoney(s.valuationAtWholesale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Transfers to restaurant</h2>
        {report?.transfers.length === 0 && <p className="text-sm text-slate-400">No transfers in this period.</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3 font-semibold">Date</th>
              <th className="py-2 pr-3 font-semibold">Store</th>
              <th className="py-2 pr-3 font-semibold">Product</th>
              <th className="py-2 pr-3 font-semibold">Qty</th>
              <th className="py-2 pr-3 font-semibold">Wholesale</th>
              <th className="py-2 font-semibold">Staff</th>
            </tr>
          </thead>
          <tbody>
            {report?.transfers.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="py-2 pr-3">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-3">{t.store.name}</td>
                <td className="py-2 pr-3">{t.product.name}</td>
                <td className="py-2 pr-3">{t.quantity}</td>
                <td className="py-2 pr-3">{formatMoney(Number(t.wholesalePrice) * t.quantity)}</td>
                <td className="py-2">{t.staff.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
