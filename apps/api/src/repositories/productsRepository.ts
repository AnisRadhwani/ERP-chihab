import type { Product, ProductPriceSnapshot } from "@ecom-erp/shared";
import { requireFirestore, docToData } from "../lib/firestore.js";

const PRODUCTS = "products";
const PRICE_HISTORY = "productPriceHistory";

export async function listProducts(): Promise<Product[]> {
  const db = requireFirestore();
  const snap = await db.collection(PRODUCTS).orderBy("name").get();
  return snap.docs.map((d) => docToData<Product>(d));
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = requireFirestore();
  const doc = await db.collection(PRODUCTS).doc(id).get();
  return doc.exists ? docToData<Product>(doc) : null;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const db = requireFirestore();
  const now = new Date().toISOString();
  const ref = db.collection(PRODUCTS).doc();
  const product: Product = {
    id: ref.id,
    ...data,
    matchKeywords: data.matchKeywords.length ? data.matchKeywords : [data.name],
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(product);

  await db.collection(PRICE_HISTORY).add({
    productId: product.id,
    buyingPriceTND: product.buyingPriceTND,
    sellingPriceTND: product.sellingPriceTND,
    effectiveFrom: now.slice(0, 10),
    effectiveTo: null,
    createdAt: now,
  });

  return product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product> {
  const db = requireFirestore();
  const existing = await getProduct(id);
  if (!existing) throw new Error("Produit introuvable");

  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const priceChanged =
    (updates.buyingPriceTND !== undefined &&
      updates.buyingPriceTND !== existing.buyingPriceTND) ||
    (updates.sellingPriceTND !== undefined &&
      updates.sellingPriceTND !== existing.sellingPriceTND);

  if (priceChanged) {
    const historySnap = await db
      .collection(PRICE_HISTORY)
      .where("productId", "==", id)
      .where("effectiveTo", "==", null)
      .limit(1)
      .get();

    if (!historySnap.empty) {
      await historySnap.docs[0].ref.update({ effectiveTo: today });
    }

    await db.collection(PRICE_HISTORY).add({
      productId: id,
      buyingPriceTND: updates.buyingPriceTND ?? existing.buyingPriceTND,
      sellingPriceTND: updates.sellingPriceTND ?? existing.sellingPriceTND,
      effectiveFrom: today,
      effectiveTo: null,
      createdAt: now,
    });
  }

  const merged: Product = {
    ...existing,
    ...updates,
    id,
    updatedAt: now,
  };

  await db.collection(PRODUCTS).doc(id).set(merged);
  return merged;
}

export async function getPriceSnapshotForDate(
  productId: string,
  date: string
): Promise<ProductPriceSnapshot | null> {
  const db = requireFirestore();
  const snap = await db
    .collection(PRICE_HISTORY)
    .where("productId", "==", productId)
    .get();

  const entries = snap.docs
    .map((d) => d.data() as ProductPriceSnapshot)
    .filter((e) => e.effectiveFrom <= date && (!e.effectiveTo || e.effectiveTo >= date))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  return entries[0] ?? null;
}

export async function getPriceSnapshotsForDate(
  date: string
): Promise<Map<string, ProductPriceSnapshot>> {
  const products = await listProducts();
  const map = new Map<string, ProductPriceSnapshot>();

  for (const p of products) {
    const snap = await getPriceSnapshotForDate(p.id, date);
    if (snap) map.set(p.id, snap);
    else {
      map.set(p.id, {
        productId: p.id,
        buyingPriceTND: p.buyingPriceTND,
        sellingPriceTND: p.sellingPriceTND,
        effectiveFrom: p.createdAt.slice(0, 10),
        effectiveTo: null,
      });
    }
  }

  return map;
}
