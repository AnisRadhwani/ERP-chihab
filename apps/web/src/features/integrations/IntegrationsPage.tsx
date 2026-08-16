import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Upload, RefreshCw } from "lucide-react";
import { importsApi, syncApi } from "../../lib/api";

export default function IntegrationsPage() {
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof syncApi.getIntegrations>
  > | null>(null);

  async function load() {
    try {
      const info = await syncApi.getIntegrations();
      setData(info);
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMsg(null);
    try {
      const result = await importsApi.xdelivery(file);
      setMsg(
        `Import OK — ${result.imported} colis (${result.matched} matchés, ${result.unmatched} non matchés) · ${result.date}`
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur import");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMsg(null);
    try {
      const result = await syncApi.syncNow();
      setMsg(
        `Sync OK — Meta: ${result.meta.message ?? result.meta.status} · X-Delivery: ${result.xdelivery.message ?? result.xdelivery.status}`
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleTest() {
    setMsg(null);
    try {
      const tests = await syncApi.testConnections();
      setMsg(
        `Meta: ${tests.meta.ok ? "✓" : "✗"} ${tests.meta.message} · X-Delivery: ${tests.xdelivery.ok ? "✓" : "✗"} ${tests.xdelivery.message}`
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur test");
    }
  }

  const statusColor = (status: string) =>
    status === "connected"
      ? "bg-green-500"
      : status === "error"
        ? "bg-red-500"
        : "bg-gray-300";

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Meta Ads, X-Delivery et import Excel"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTest}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sync..." : "Sync Now"}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              {importing ? "Import..." : "Import Excel"}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>
          </div>
        }
      />

      {data && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Mode mock : {data.mockMode ? "ON" : "OFF"}
        </div>
      )}

      {msg && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            msg.includes("OK") || msg.includes("✓")
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {(data?.integrations ?? []).map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor(integration.status)}`}
              />
              <div>
                <p className="font-semibold text-gray-900">{integration.name}</p>
                <p className="text-sm text-gray-500">{integration.message}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {integration.configured ? "Configuré" : "Non configuré"}
            </span>
          </div>
        ))}
      </div>

      {data?.recentLogs && data.recentLogs.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Sync Logs</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Source", "Statut", "Records", "Erreur", "Date"].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm">{log.source}</td>
                  <td className="px-4 py-3 text-sm">{log.status}</td>
                  <td className="px-4 py-3 text-sm">{log.recordsProcessed}</td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    {log.errorMessage ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(log.startedAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <p className="font-semibold">Temps réel X-Delivery (sans Excel)</p>
        <p className="mt-2">
          L&apos;API X-Delivery ne liste pas les colis. Pour les nouveaux colis
          automatiquement, configurez le webhook :
        </p>
        <code className="mt-2 block rounded bg-white px-3 py-2 text-xs break-all">
          POST https://VOTRE-URL/api/webhooks/xdelivery
        </code>
        <p className="mt-2 text-xs">
          Authorization: Bearer [clé API X-Delivery] · En local : ngrok http 3000
          <br />
          Auto-sync 5 min · Daily Profit refresh 30s · Excel = initialisation une
          fois
        </p>
      </div>
    </>
  );
}
