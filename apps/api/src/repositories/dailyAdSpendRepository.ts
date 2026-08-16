import type { DailyAdSpend } from "@ecom-erp/shared";
import { requireFirestore } from "../lib/firestore.js";

const COLLECTION = "dailyAdSpend";

export async function saveDailyAdSpend(data: DailyAdSpend): Promise<void> {
  const db = requireFirestore();
  await db.collection(COLLECTION).doc(data.date).set({
    ...data,
    syncedAt: new Date().toISOString(),
  });
}

export async function getDailyAdSpend(
  date: string
): Promise<(DailyAdSpend & { syncedAt?: string }) | null> {
  const db = requireFirestore();
  const doc = await db.collection(COLLECTION).doc(date).get();
  if (!doc.exists) return null;
  return doc.data() as DailyAdSpend & { syncedAt?: string };
}
