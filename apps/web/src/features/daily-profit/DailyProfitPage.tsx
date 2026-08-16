import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { KpiCard } from "../../components/ui/KpiCard";
import { Modal } from "../../components/ui/Modal";
import { profitApi, productsApi, settingsApi, importsApi, syncApi } from "../../lib/api";
import type { DailyProfitSummary, Product } from "@ecom-erp/shared";
import {
  formatDisplayDate,
  formatTND,
  formatUSD,
  shiftDate,
  todayISO,
} from "../../lib/format";
import { Upload, RefreshCw } from "lucide-react";

export default function DailyProfitPage() {
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState<DailyProfitSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSpends, setAdSpends] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [allocating, setAllocating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profit, prods, adAlloc] = await Promise.all([
        profitApi.getDaily(date),
        productsApi.list(),
        settingsApi.getAdSpend(date),
      ]);
      setSummary(profit);
      setProducts(prods);

      const spends: Record<string, string> = {};
      for (const p of prods) {
        const found = adAlloc?.allocations.find((a) => a.productId === p.id);
        spends[p.id] = found ? String(found.spendUSD) : "";
      }
      setAdSpends(spends);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    setImportMsg(null);
    try {
      const result = await syncApi.syncNow(date);
      setImportMsg(
        `Sync — Meta: ${result.meta.message ?? result.meta.status} · X-Delivery: ${result.xdelivery.message ?? result.xdelivery.status}`
      );
      await load();
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Erreur sync");
    } finally {
      setSyncing(false);
    }
  }

  async function autoAllocateMetaSpend() {
    setAllocating(true);
    setImportMsg(null);
    try {
      const result = await syncApi.allocateMeta(date);
      const msg =
        result.matched.length > 0
          ? `${result.matched.length} campagne(s) Meta → produits (${formatUSD(result.totalSpendUSD)})`
          : "Aucune campagne Meta matchée — vérifiez les mots-clés produits";
      setImportMsg(msg);
      await load();
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Erreur allocation Meta");
    } finally {
      setAllocating(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const result = await importsApi.xdelivery(file);
      setImportMsg(
        `Import OK — ${result.imported} colis (${result.matched} matchés, ${result.unmatched} non matchés)`
      );
      if (result.date) setDate(result.date);
      await load();
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Erreur import");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  async function saveAdSpend() {
    const allocations = products
      .map((p) => ({
        productId: p.id,
        spendUSD: parseFloat(adSpends[p.id] || "0"),
      }))
      .filter((a) => a.spendUSD > 0);

    await settingsApi.saveAdSpend(date, allocations);
    setAdModalOpen(false);
    await load();
  }

  const isToday = date === todayISO();

  return (
    <>
      <PageHeader
        title="Daily Profit"
        description="Combien avez-vous réellement gagné ce jour-là ?"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sync Now
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              {importing ? "Import..." : "Import Excel X-Delivery"}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>
            <button
              type="button"
              onClick={() => setAdModalOpen(true)}
              className="rounded-lg bg-accent-blue px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ad Spend
            </button>
            <button
              type="button"
              onClick={() => setDate(shiftDate(date, -1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Jour précédent
            </button>
            <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-accent-blue">
              {isToday ? "Aujourd'hui" : formatDisplayDate(date)}
            </span>
            <button
              type="button"
              onClick={() => setDate(shiftDate(date, 1))}
              disabled={date >= todayISO()}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Jour suivant →
            </button>
          </div>
        }
      />

      {summary?.metaFetchedSpendUSD != null && (
        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Meta Ads (API) — Total du jour :{" "}
              <strong>{formatUSD(summary.metaFetchedSpendUSD)}</strong>
              {summary.adSpendUSD > 0 && (
                <>
                  {" "}
                  · Alloué aux produits : {formatUSD(summary.adSpendUSD)} (
                  {formatTND(summary.adSpendTND)})
                </>
              )}
            </span>
            <button
              type="button"
              onClick={autoAllocateMetaSpend}
              disabled={allocating}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {allocating ? "Allocation..." : "Allouer Meta spend aux produits"}
            </button>
          </div>
          {summary.metaCampaigns && summary.metaCampaigns.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-purple-800">
              {summary.metaCampaigns.map((c) => (
                <li key={c.campaignName}>
                  {c.campaignName}: {formatUSD(c.spendUSD)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {summary?.unmatchedCampaigns && summary.unmatchedCampaigns.length > 0 && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <p className="font-medium">
            {summary.unmatchedCampaigns.length} campagne(s) Meta non matchée(s)
          </p>
          <p className="mt-1 text-xs text-orange-800">
            Ajoutez des mots-clés sur vos produits correspondant aux noms de campagne.
          </p>
          <ul className="mt-2 space-y-0.5 text-xs">
            {summary.unmatchedCampaigns.map((c) => (
              <li key={c.campaignName}>
                {c.campaignName}: {formatUSD(c.spendUSD)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {importMsg && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {importMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Commandes livrées"
          value={loading ? "—" : String(summary?.deliveredCount ?? 0)}
          accent="blue"
        />
        <KpiCard
          label="Ad Spend"
          value={
            loading
              ? "—"
              : formatUSD(summary?.adSpendUSD ?? summary?.metaFetchedSpendUSD ?? 0)
          }
          subtext={
            loading
              ? undefined
              : `USD · ${formatTND(summary?.adSpendTND ?? 0)} TND (×${summary?.usdToTndRate ?? "—"})`
          }
        />
        <KpiCard
          label="Revenue"
          value={loading ? "—" : formatTND(summary?.revenueTND ?? 0)}
          accent="blue"
        />
        <KpiCard
          label="Estimated Net Profit"
          value={loading ? "—" : formatTND(summary?.estimatedNetProfitTND ?? 0)}
          accent="green"
          subtext="TND · estimé"
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Produit",
                  "Livrés",
                  "Ad Spend (USD)",
                  "Ad Spend (TND)",
                  "Prix achat",
                  "Prix vente",
                  "Coût pub/cmd",
                  "Profit/cmd",
                  "Profit total",
                  "Revenue",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : !summary?.products.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucune donnée. Importez un Excel X-Delivery et créez vos produits.
                  </td>
                </tr>
              ) : (
                summary.products.map((row) => (
                  <tr key={row.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div>{row.productName}</div>
                      {row.metaCampaigns && row.metaCampaigns.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-xs font-normal text-purple-700">
                          {row.metaCampaigns.map((c) => (
                            <li key={c.campaignName}>
                              {c.campaignName}: {formatUSD(c.spendUSD)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.deliveredCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatUSD(row.adSpendUSD)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTND(row.adSpendTND)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.buyingPriceTND} DT
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.sellingPriceTND} DT
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTND(row.adCostPerOrderTND)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTND(row.profitPerOrderTND)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {formatTND(row.totalProfitTND)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTND(row.revenueTND)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && summary.products.length > 0 && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-sm">TOTAL</td>
                  <td className="px-4 py-3 text-sm">{summary.deliveredCount}</td>
                  <td className="px-4 py-3 text-sm">{formatUSD(summary.adSpendUSD)}</td>
                  <td className="px-4 py-3 text-sm">{formatTND(summary.adSpendTND)}</td>
                  <td colSpan={4} className="px-4 py-3" />
                  <td className="px-4 py-3 text-sm text-green-700">
                    {formatTND(summary.estimatedNetProfitTND)}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatTND(summary.revenueTND)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {summary && summary.unmatched.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">
            ⚠ {summary.unmatched.length} colis non matchés
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            Ajoutez des mots-clés sur vos produits ou créez les produits manquants.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {summary.unmatched.slice(0, 8).map((u) => (
              <li key={u.barcode}>
                <span className="font-mono">{u.barcode}</span> — {u.marchandise}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={adModalOpen}
        title={`Ad Spend — ${formatDisplayDate(date)}`}
        onClose={() => setAdModalOpen(false)}
      >
        <div className="space-y-3">
          {products.filter((p) => p.active).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <label className="flex-1 text-sm text-gray-700">{p.name}</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adSpends[p.id] ?? ""}
                  onChange={(e) =>
                    setAdSpends({ ...adSpends, [p.id]: e.target.value })
                  }
                  className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setAdModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={saveAdSpend}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
