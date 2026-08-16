import {
  allocateCampaignsToProducts,
  type CampaignAllocationResult,
} from "@ecom-erp/shared";
import { listProducts } from "../repositories/productsRepository.js";
import { getDailyAdSpend } from "../repositories/dailyAdSpendRepository.js";
import { saveAdSpendAllocation } from "../repositories/settingsRepository.js";

export async function autoAllocateMetaSpend(
  date: string
): Promise<CampaignAllocationResult & { totalSpendUSD: number }> {
  const metaSpend = await getDailyAdSpend(date);
  if (!metaSpend?.accounts[0]?.campaigns.length) {
    return {
      allocations: [],
      matched: [],
      unmatched: [],
      totalSpendUSD: 0,
    };
  }

  const products = await listProducts();
  const result = allocateCampaignsToProducts(
    metaSpend.accounts[0].campaigns,
    products.filter((p) => p.active)
  );

  if (result.allocations.length > 0) {
    await saveAdSpendAllocation({
      date,
      allocations: result.allocations,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    ...result,
    totalSpendUSD: metaSpend.totalSpendUSD,
  };
}
