import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { settingsApi } from "../../lib/api";
import type { AppSettings } from "@ecom-erp/shared";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rate, setRate] = useState("2.9");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings(s);
      setRate(String(s.usdToTndRate));
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await settingsApi.update({
        usdToTndRate: parseFloat(rate),
      });
      setSettings(updated);
      setMsg("Paramètres enregistrés");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Paramètres globaux de l'application"
      />

      {msg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <div className="max-w-lg space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Taux de change USD/TND
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Utilisé pour convertir le Ad Spend Meta en dinars tunisiens.
          </p>
          <div className="mt-4">
            <label
              htmlFor="usd-tnd-rate"
              className="block text-sm font-medium text-gray-700"
            >
              USD/TND
            </label>
            <input
              id="usd-tnd-rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Mode Mock</h2>
          <p className="mt-1 text-sm text-gray-500">
            Utilise des données fictives pour le développement sans APIs réelles.
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Mock {settings?.mockMode ? "ON" : "OFF"} (via .env)
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
