import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { KpiCard } from "../../components/ui/KpiCard";
import { fetchHealth, type HealthStatus } from "../../lib/apiClient";
import { dashboardApi } from "../../lib/api";
import type { DailyProfitSummary } from "@ecom-erp/shared";
import { formatTND, formatUSD } from "../../lib/format";

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [today, setToday] = useState<{
    deliveredCount: number;
    adSpendUSD: number;
    revenueTND: number;
    estimatedNetProfitTND: number;
  } | null>(null);
  const [recent, setRecent] = useState<DailyProfitSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err: Error) => {
        setHealth(null);
        setError(err.message);
      });

    dashboardApi
      .today()
      .then(setToday)
      .catch(() => setToday(null));

    dashboardApi
      .recent()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de la performance du jour"
      />

      {error && health?.status !== "ok" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Backend non connecté — démarrez l&apos;API avec{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>
        </div>
      )}

      {health?.status === "ok" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          API connectée — Mode mock : {health.mockMode ? "ON" : "OFF"} · Firebase
          : {health.firebaseConfigured ? " configuré" : " non configuré"}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Commandes livrées"
          value={String(today?.deliveredCount ?? 0)}
          accent="blue"
          subtext="Aujourd'hui"
        />
        <KpiCard
          label="Ad Spend"
          value={formatUSD(today?.adSpendUSD ?? 0)}
          subtext="USD"
        />
        <KpiCard
          label="Revenue"
          value={formatTND(today?.revenueTND ?? 0)}
          accent="blue"
          subtext="TND"
        />
        <KpiCard
          label="Estimated Net Profit"
          value={formatTND(today?.estimatedNetProfitTND ?? 0)}
          accent="green"
          subtext="TND · estimé"
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Performance récente
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Date", "Livrés", "Ad Spend", "Revenue", "Profit estimé"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Importez un Excel X-Delivery pour voir l&apos;historique
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.deliveredCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatUSD(row.adSpendUSD)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTND(row.revenueTND)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {formatTND(row.estimatedNetProfitTND)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
