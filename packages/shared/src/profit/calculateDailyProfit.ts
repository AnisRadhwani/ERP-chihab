import type {
  AdSpendAllocation,
  ProductDailyProfitRow,
  ProductPriceSnapshot,
  UnmatchedParcelRow,
  DailyProfitSummary,
} from "../types/index.js";

export interface DeliveredParcelAggregate {
  productId: string;
  productName: string;
  parcelCount: number;
  totalQuantity: number;
  revenueTND: number;
}

export interface ProfitCalculationInput {
  date: string;
  usdToTndRate: number;
  aggregates: DeliveredParcelAggregate[];
  priceSnapshots: Map<string, ProductPriceSnapshot>;
  adAllocations: AdSpendAllocation | null;
  unmatched: UnmatchedParcelRow[];
}

export function calculateProductProfitRow(input: {
  productId: string;
  productName: string;
  deliveredCount: number;
  totalQuantity: number;
  revenueTND: number;
  buyingPriceTND: number;
  sellingPriceTND: number;
  adSpendUSD: number;
  usdToTndRate: number;
}): ProductDailyProfitRow {
  const {
    productId,
    productName,
    deliveredCount,
    totalQuantity,
    revenueTND,
    buyingPriceTND,
    sellingPriceTND,
    adSpendUSD,
    usdToTndRate,
  } = input;

  const adSpendTND = adSpendUSD * usdToTndRate;
  const adCostPerOrderTND =
    deliveredCount > 0 ? adSpendTND / deliveredCount : 0;
  const productCostTND = totalQuantity * buyingPriceTND;
  const totalProfitTND = revenueTND - productCostTND - adSpendTND;
  const profitPerOrderTND =
    deliveredCount > 0 ? totalProfitTND / deliveredCount : 0;

  return {
    productId,
    productName,
    deliveredCount,
    adSpendUSD,
    adSpendTND: round2(adSpendTND),
    buyingPriceTND,
    sellingPriceTND,
    adCostPerOrderTND: round2(adCostPerOrderTND),
    profitPerOrderTND: round2(profitPerOrderTND),
    totalProfitTND: round2(totalProfitTND),
    revenueTND: round2(revenueTND),
  };
}

export function calculateDailyProfit(
  input: ProfitCalculationInput
): DailyProfitSummary {
  const { date, usdToTndRate, aggregates, priceSnapshots, adAllocations, unmatched } =
    input;

  const allocationMap = new Map<string, number>();
  for (const a of adAllocations?.allocations ?? []) {
    allocationMap.set(a.productId, a.spendUSD);
  }

  const products: ProductDailyProfitRow[] = aggregates.map((agg) => {
    const snapshot = priceSnapshots.get(agg.productId);
    const buyingPriceTND = snapshot?.buyingPriceTND ?? 0;
    const sellingPriceTND = snapshot?.sellingPriceTND ?? 0;
    const adSpendUSD = allocationMap.get(agg.productId) ?? 0;

    return calculateProductProfitRow({
      productId: agg.productId,
      productName: agg.productName,
      deliveredCount: agg.parcelCount,
      totalQuantity: agg.totalQuantity,
      revenueTND: agg.revenueTND,
      buyingPriceTND,
      sellingPriceTND,
      adSpendUSD,
      usdToTndRate,
    });
  });

  const deliveredCount = products.reduce((s, p) => s + p.deliveredCount, 0);
  const adSpendUSD = products.reduce((s, p) => s + p.adSpendUSD, 0);
  const adSpendTND = adSpendUSD * usdToTndRate;
  const revenueTND = products.reduce((s, p) => s + p.revenueTND, 0);
  const estimatedNetProfitTND = products.reduce(
    (s, p) => s + p.totalProfitTND,
    0
  );

  return {
    date,
    deliveredCount,
    adSpendUSD: round2(adSpendUSD),
    adSpendTND: round2(adSpendTND),
    metaFetchedSpendUSD: null,
    revenueTND: round2(revenueTND),
    estimatedNetProfitTND: round2(estimatedNetProfitTND),
    usdToTndRate,
    products,
    unmatched,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
