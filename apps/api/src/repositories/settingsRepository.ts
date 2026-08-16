import type { AppSettings, AdSpendAllocation } from "@ecom-erp/shared";
import { requireFirestore } from "../lib/firestore.js";

const SETTINGS_DOC = "settings/global";
const AD_SPEND = "adSpendAllocations";

const DEFAULT_SETTINGS: AppSettings = {
  usdToTndRate: 2.9,
  defaultCurrency: "TND",
  mockMode: true,
  updatedAt: new Date().toISOString(),
};

export async function getSettings(): Promise<AppSettings> {
  const db = requireFirestore();
  const doc = await db.doc(SETTINGS_DOC).get();
  if (!doc.exists) {
    await db.doc(SETTINGS_DOC).set(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return doc.data() as AppSettings;
}

export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  const db = requireFirestore();
  const current = await getSettings();
  const merged: AppSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.doc(SETTINGS_DOC).set(merged);
  return merged;
}

export async function getAdSpendAllocation(
  date: string
): Promise<AdSpendAllocation | null> {
  const db = requireFirestore();
  const doc = await db.collection(AD_SPEND).doc(date).get();
  if (!doc.exists) return null;
  return doc.data() as AdSpendAllocation;
}

export async function saveAdSpendAllocation(
  allocation: AdSpendAllocation
): Promise<AdSpendAllocation> {
  const db = requireFirestore();
  await db.collection(AD_SPEND).doc(allocation.date).set(allocation);
  return allocation;
}
