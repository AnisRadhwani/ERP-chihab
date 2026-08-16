import {
  calculateDailyProfit,
  allocateCampaignsToProducts,
  type DailyProfitSummary,
  type UnmatchedParcelRow,
} from "@ecom-erp/shared";
import { listParcelsByDate } from "../repositories/parcelsRepository.js";
import {
  listProducts,
  getPriceSnapshotsForDate,
} from "../repositories/productsRepository.js";
import {
  getSettings,
  getAdSpendAllocation,
  saveAdSpendAllocation,
} from "../repositories/settingsRepository.js";
import { getDailyAdSpend } from "../repositories/dailyAdSpendRepository.js";

export async function getDailyProfit(
  date: string
): Promise<DailyProfitSummary> {
  const [parcels, products, settings, metaSpend] = await Promise.all([
    listParcelsByDate(date),
    listProducts(),
    getSettings(),
    getDailyAdSpend(date),
  ]);

  let adAllocations = await getAdSpendAllocation(date);

  const campaigns = metaSpend?.accounts[0]?.campaigns ?? [];
  let campaignAllocation = allocateCampaignsToProducts(
    campaigns,
    products.filter((p) => p.active)
  );

  if (
    campaigns.length > 0 &&
    (!adAllocations?.allocations.length ||
      adAllocations.allocations.every((a) => a.spendUSD === 0))
  ) {
    if (campaignAllocation.allocations.length > 0) {
      adAllocations = await saveAdSpendAllocation({
        date,
        allocations: campaignAllocation.allocations,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const aggregates = new Map<
    string,
    {
      productId: string;
      productName: string;
      parcelCount: number;
      totalQuantity: number;
      revenueTND: number;
    }
  >();

  const unmatched: UnmatchedParcelRow[] = [];

  for (const parcel of parcels) {
    if (parcel.matchStatus === "unmatched" || !parcel.productId) {
      unmatched.push({
        barcode: parcel.barcode,
        marchandise: parcel.marchandise,
        montantTND: parcel.montantTND,
        quantity: parcel.quantity,
      });
      continue;
    }

    const product = productMap.get(parcel.productId);
    if (!product) continue;

    const existing = aggregates.get(parcel.productId) ?? {
      productId: parcel.productId,
      productName: product.name,
      parcelCount: 0,
      totalQuantity: 0,
      revenueTND: 0,
    };

    existing.parcelCount += 1;
    existing.totalQuantity += parcel.quantity;
    const lineRevenue =
      parcel.montantTND > 0
        ? parcel.montantTND
        : product.sellingPriceTND * parcel.quantity;
    existing.revenueTND += lineRevenue;
    aggregates.set(parcel.productId, existing);
  }

  const priceSnapshots = await getPriceSnapshotsForDate(date);

  const summary = calculateDailyProfit({
    date,
    usdToTndRate: settings.usdToTndRate,
    aggregates: [...aggregates.values()],
    priceSnapshots,
    adAllocations,
    unmatched,
  });

  const campaignsByProduct = new Map<
    string,
    { campaignName: string; spendUSD: number }[]
  >();
  for (const m of campaignAllocation.matched) {
    const product = products.find((p) => p.name === m.productName);
    if (!product) continue;
    const list = campaignsByProduct.get(product.id) ?? [];
    list.push({ campaignName: m.campaignName, spendUSD: m.spendUSD });
    campaignsByProduct.set(product.id, list);
  }

  const productsWithCampaigns = summary.products.map((row) => ({
    ...row,
    metaCampaigns: campaignsByProduct.get(row.productId) ?? [],
  }));

  return {
    ...summary,
    products: productsWithCampaigns,
    metaFetchedSpendUSD: metaSpend?.totalSpendUSD ?? null,
    metaCampaigns: campaigns.map((c) => ({
      campaignName: c.campaignName,
      spendUSD: c.spendUSD,
    })),
    unmatchedCampaigns: campaignAllocation.unmatched,
  };
}

export async function getDashboardSummary(date: string) {
  const profit = await getDailyProfit(date);
  return {
    date: profit.date,
    deliveredCount: profit.deliveredCount,
    adSpendUSD: profit.adSpendUSD || profit.metaFetchedSpendUSD || 0,
    adSpendTND: profit.adSpendTND,
    revenueTND: profit.revenueTND,
    estimatedNetProfitTND: profit.estimatedNetProfitTND,
  };
}

export async function getRecentDailyPerformance(days = 7) {
  const results: DailyProfitSummary[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    try {
      const summary = await getDailyProfit(dateStr);
      if (summary.deliveredCount > 0) {
        results.push(summary);
      }
    } catch {
      // skip days without data
    }
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}
