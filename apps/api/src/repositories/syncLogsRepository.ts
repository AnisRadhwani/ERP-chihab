import type { SyncLog } from "@ecom-erp/shared";
import { requireFirestore } from "../lib/firestore.js";

const COLLECTION = "syncLogs";

export async function createSyncLog(
  data: Omit<SyncLog, "id">
): Promise<SyncLog> {
  const db = requireFirestore();
  const ref = db.collection(COLLECTION).doc();
  const log: SyncLog = { id: ref.id, ...data };
  await ref.set(log);
  return log;
}

export async function getRecentSyncLogs(limit = 10): Promise<SyncLog[]> {
  const db = requireFirestore();
  const snap = await db
    .collection(COLLECTION)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SyncLog);
}

export async function getLastSuccessfulSync(
  source: string
): Promise<SyncLog | null> {
  const db = requireFirestore();
  const snap = await db
    .collection(COLLECTION)
    .where("source", "==", source)
    .where("status", "==", "success")
    .orderBy("startedAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as SyncLog;
}
