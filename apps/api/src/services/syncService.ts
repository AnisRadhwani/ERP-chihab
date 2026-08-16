import { saveDailyAdSpend } from "../repositories/dailyAdSpendRepository.js";
import { createSyncLog } from "../repositories/syncLogsRepository.js";
import {
  getMetaAdsProvider,
  getXDeliveryProvider,
  isMetaConfigured,
  isXDeliveryConfigured,
} from "../providers/registry.js";
import { syncXDeliveryStatuses } from "./xdeliveryLiveService.js";
import { autoAllocateMetaSpend } from "./metaAllocationService.js";

export interface SyncResult {
  date: string;
  meta: {
    status: "success" | "failed" | "skipped";
    totalSpendUSD: number | null;
    message: string | null;
  };
  xdelivery: {
    status: "success" | "failed" | "skipped";
    barcodesChecked: number;
    deliveredConfirmed: number;
    message: string | null;
  };
}

export async function syncDay(date: string): Promise<SyncResult> {
  const result: SyncResult = {
    date,
    meta: { status: "skipped", totalSpendUSD: null, message: null },
    xdelivery: {
      status: "skipped",
      barcodesChecked: 0,
      deliveredConfirmed: 0,
      message: null,
    },
  };

  // ─── Meta Ads ───
  const metaStart = new Date().toISOString();
  try {
    const meta = getMetaAdsProvider();
    const spend = await meta.getDailySpend({ date, adAccountId: "" });
    await saveDailyAdSpend(spend);

    const allocation = await autoAllocateMetaSpend(date);
    const allocMsg =
      allocation.allocations.length > 0
        ? ` · ${allocation.matched.length} campagnes → ${allocation.allocations.length} produits`
        : allocation.unmatched.length > 0
          ? ` · ${allocation.unmatched.length} campagnes non matchées`
          : "";

    result.meta = {
      status: "success",
      totalSpendUSD: spend.totalSpendUSD,
      message: `$${spend.totalSpendUSD} — ${spend.accounts[0]?.campaigns.length ?? 0} campagnes${allocMsg}`,
    };
    await createSyncLog({
      source: "meta_ads",
      startedAt: metaStart,
      finishedAt: new Date().toISOString(),
      status: "success",
      recordsProcessed: spend.accounts[0]?.campaigns.length ?? 0,
      errorMessage: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Meta";
    result.meta = { status: "failed", totalSpendUSD: null, message: msg };
    await createSyncLog({
      source: "meta_ads",
      startedAt: metaStart,
      finishedAt: new Date().toISOString(),
      status: "failed",
      recordsProcessed: 0,
      errorMessage: msg,
    });
  }

  // ─── X-Delivery live sync (API statut — tous colis connus) ───
  const xdStart = new Date().toISOString();
  try {
    const live = await syncXDeliveryStatuses(date);
    result.xdelivery = {
      status: "success",
      barcodesChecked: live.barcodesChecked,
      deliveredConfirmed: live.deliveredConfirmed,
      message: live.message,
    };

    await createSyncLog({
      source: "xdelivery",
      startedAt: xdStart,
      finishedAt: new Date().toISOString(),
      status: "success",
      recordsProcessed: live.barcodesChecked,
      errorMessage: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur X-Delivery";
    result.xdelivery = {
      status: "failed",
      barcodesChecked: 0,
      deliveredConfirmed: 0,
      message: msg,
    };
    await createSyncLog({
      source: "xdelivery",
      startedAt: xdStart,
      finishedAt: new Date().toISOString(),
      status: "failed",
      recordsProcessed: 0,
      errorMessage: msg,
    });
  }

  return result;
}

export async function testIntegrations() {
  const meta = getMetaAdsProvider();
  const xdelivery = getXDeliveryProvider();

  const [metaResult, xdResult] = await Promise.all([
    meta.testConnection(),
    xdelivery.testConnection(),
  ]);

  return {
    meta: {
      configured: isMetaConfigured(),
      ...metaResult,
    },
    xdelivery: {
      configured: isXDeliveryConfigured(),
      ...xdResult,
    },
  };
}
