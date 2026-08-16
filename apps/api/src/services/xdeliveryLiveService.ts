import type { Parcel } from "@ecom-erp/shared";
import { matchProduct, parseMarchandise } from "@ecom-erp/shared";
import { listProducts } from "../repositories/productsRepository.js";
import {
  buildParcelId,
  getParcelByBarcode,
  upsertParcel,
  listAllBarcodes,
  listParcelsByDate,
} from "../repositories/parcelsRepository.js";
import { getXDeliveryProvider } from "../providers/registry.js";

export const DELIVERED_STATUSES = new Set(["DELIVERED", "DELIVERED_PAID"]);

export interface XDeliveryWebhookPayload {
  barcode: number | string;
  status: string;
  motif?: string;
}

export async function handleXDeliveryWebhook(
  payload: XDeliveryWebhookPayload
): Promise<Parcel> {
  const barcode = String(payload.barcode);
  const status = payload.status;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const existing = await getParcelByBarcode(barcode);
  const products = await listProducts();
  const activeProducts = products.filter((p) => p.active);

  if (existing) {
    existing.xdeliveryStatus = status;
    existing.lastSyncedAt = now;

    if (DELIVERED_STATUSES.has(status)) {
      if (!existing.deliveredDate) existing.deliveredDate = today;
      if (existing.matchStatus === "unmatched" && existing.marchandise) {
        const matched = matchProduct(existing.marchandise, activeProducts);
        if (matched) {
          existing.productId = matched.id;
          existing.productNameMatched = matched.name;
          existing.matchStatus = "matched";
        }
      }
    }

    await upsertParcel(existing);
    return existing;
  }

  const marchandise = `Colis ${barcode}`;
  const matched = matchProduct(marchandise, activeProducts);

  const parcel: Parcel = {
    id: buildParcelId(barcode),
    source: "xdelivery",
    barcode,
    marchandise,
    montantTND: 0,
    quantity: 1,
    deliveredDate: DELIVERED_STATUSES.has(status) ? today : "",
    deliveredTime: null,
    productId: matched?.id ?? null,
    productNameMatched: matched?.name ?? null,
    matchStatus: matched ? "matched" : "unmatched",
    clientName: "",
    phone: "",
    importedAt: now,
    xdeliveryStatus: status,
    lastSyncedAt: now,
  };

  await upsertParcel(parcel);
  return parcel;
}

export async function syncXDeliveryStatuses(date: string): Promise<{
  barcodesChecked: number;
  deliveredConfirmed: number;
  newlyDelivered: number;
  message: string;
}> {
  const barcodes = await listAllBarcodes();

  if (barcodes.length === 0) {
    return {
      barcodesChecked: 0,
      deliveredConfirmed: 0,
      newlyDelivered: 0,
      message:
        "Aucun colis connu. Configurez le webhook X-Delivery ou importez Excel une fois.",
    };
  }

  const xdelivery = getXDeliveryProvider();
  const BATCH = 100;
  let deliveredConfirmed = 0;
  let newlyDelivered = 0;
  const products = await listProducts();
  const activeProducts = products.filter((p) => p.active);
  const now = new Date().toISOString();

  for (let i = 0; i < barcodes.length; i += BATCH) {
    const batch = barcodes.slice(i, i + BATCH);
    const statuses = await xdelivery.getParcelStatuses(batch);

    for (const st of statuses) {
      const parcel = await getParcelByBarcode(st.barcode);
      if (!parcel) continue;

      const wasDelivered = DELIVERED_STATUSES.has(parcel.xdeliveryStatus ?? "");
      const isDelivered = DELIVERED_STATUSES.has(st.status);

      parcel.xdeliveryStatus = st.status;
      parcel.lastSyncedAt = now;

      if (isDelivered) {
        deliveredConfirmed++;
        if (!parcel.deliveredDate) {
          parcel.deliveredDate = date;
          newlyDelivered++;
        } else if (parcel.deliveredDate === date) {
          newlyDelivered++;
        }

        if (parcel.matchStatus === "unmatched" && parcel.marchandise) {
          const matched = matchProduct(parcel.marchandise, activeProducts);
          if (matched) {
            parcel.productId = matched.id;
            parcel.productNameMatched = matched.name;
            parcel.matchStatus = "matched";
            if (parcel.montantTND === 0) {
              const fullProduct = products.find((p) => p.id === matched.id);
              if (fullProduct) parcel.montantTND = fullProduct.sellingPriceTND;
            }
          }
        }
      }

      await upsertParcel(parcel);
    }
  }

  const deliveredTodayList = await listParcelsByDate(date);
  const count = deliveredTodayList.length;

  return {
    barcodesChecked: barcodes.length,
    deliveredConfirmed,
    newlyDelivered,
    message: `${count} colis livrés le ${date} · ${deliveredConfirmed} confirmés via API`,
  };
}

export { parseMarchandise };
