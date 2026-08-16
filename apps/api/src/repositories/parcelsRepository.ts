import type { Parcel } from "@ecom-erp/shared";
import { requireFirestore, docToData } from "../lib/firestore.js";

const PARCELS = "parcels";

function parcelDocId(barcode: string): string {
  return `xdelivery_${barcode}`;
}

export async function getParcelByBarcode(
  barcode: string
): Promise<Parcel | null> {
  const db = requireFirestore();
  const doc = await db.collection(PARCELS).doc(parcelDocId(barcode)).get();
  return doc.exists ? docToData<Parcel>(doc) : null;
}

export async function upsertParcel(parcel: Parcel): Promise<Parcel> {
  const db = requireFirestore();
  await db.collection(PARCELS).doc(parcel.id).set(parcel);
  return parcel;
}

export async function listParcelsByDate(date: string): Promise<Parcel[]> {
  const db = requireFirestore();
  const snap = await db
    .collection(PARCELS)
    .where("deliveredDate", "==", date)
    .get();
  return snap.docs.map((d) => normalizeParcel(docToData<Parcel>(d)));
}

export async function listAllBarcodes(): Promise<string[]> {
  const db = requireFirestore();
  const snap = await db.collection(PARCELS).select("barcode").get();
  return snap.docs.map((d) => d.data().barcode as string).filter(Boolean);
}

function normalizeParcel(parcel: Parcel): Parcel {
  return {
    ...parcel,
    xdeliveryStatus: parcel.xdeliveryStatus ?? "",
    lastSyncedAt: parcel.lastSyncedAt ?? null,
  };
}

export async function listParcelsInRange(
  fromDate: string,
  toDate: string
): Promise<Parcel[]> {
  const db = requireFirestore();
  const snap = await db
    .collection(PARCELS)
    .where("deliveredDate", ">=", fromDate)
    .where("deliveredDate", "<=", toDate)
    .get();
  return snap.docs.map((d) => docToData<Parcel>(d));
}

export function buildParcelId(barcode: string): string {
  return parcelDocId(barcode);
}
