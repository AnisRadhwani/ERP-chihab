import XLSX from "xlsx";
import {
  parseMarchandise,
  matchProduct,
  type ImportResult,
  type Parcel,
  type XDeliveryExcelRow,
} from "@ecom-erp/shared";
import { listProducts } from "../repositories/productsRepository.js";
import {
  buildParcelId,
  getParcelByBarcode,
  upsertParcel,
} from "../repositories/parcelsRepository.js";

function parseExcelDate(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = value.split(/[/.-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (y.length === 4) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  return String(value).slice(0, 10);
}

function parseMontant(value: unknown): number {
  if (typeof value === "number") return value;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function importXDeliveryExcel(
  buffer: Buffer
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<XDeliveryExcelRow>(sheet, {
    defval: "",
  });

  const products = await listProducts();
  const activeProducts = products.filter((p) => p.active);

  let imported = 0;
  let skipped = 0;
  let matched = 0;
  let unmatched = 0;
  const unmatchedSamples: { barcode: string; marchandise: string }[] = [];
  let primaryDate = "";

  for (const row of rows) {
    const barcode = String(row.Code ?? "").trim();
    if (!barcode) continue;

    const deliveredDate = parseExcelDate(row["Livré le"]);
    if (!primaryDate && deliveredDate) primaryDate = deliveredDate;

    const existing = await getParcelByBarcode(barcode);
    if (existing && existing.deliveredDate === deliveredDate) {
      skipped++;
      continue;
    }

    const marchandise = String(row.Marchandise ?? "").trim();
    const { quantity } = parseMarchandise(marchandise);
    const matchedProduct = matchProduct(marchandise, activeProducts);

    const parcel: Parcel = {
      id: buildParcelId(barcode),
      source: "xdelivery",
      barcode,
      marchandise,
      montantTND: parseMontant(row.Montant),
      quantity,
      deliveredDate,
      deliveredTime: String(row["Heure de livraison"] ?? "") || null,
      productId: matchedProduct?.id ?? null,
      productNameMatched: matchedProduct?.name ?? null,
      matchStatus: matchedProduct ? "matched" : "unmatched",
      clientName: String(row.Client ?? ""),
      phone: String(row.Téléphone ?? ""),
      importedAt: new Date().toISOString(),
      xdeliveryStatus: "DELIVERED",
      lastSyncedAt: new Date().toISOString(),
    };

    await upsertParcel(parcel);
    imported++;

    if (matchedProduct) matched++;
    else {
      unmatched++;
      if (unmatchedSamples.length < 10) {
        unmatchedSamples.push({ barcode, marchandise });
      }
    }
  }

  return {
    date: primaryDate,
    totalRows: rows.length,
    imported,
    skipped,
    matched,
    unmatched,
    unmatchedSamples,
  };
}
