import { matchProduct, type MatchableProduct } from "../xdelivery/matching.js";

export interface CampaignSpendInput {
  campaignId: string;
  campaignName: string;
  spendUSD: number;
}

export interface CampaignAllocationResult {
  allocations: { productId: string; spendUSD: number }[];
  matched: { campaignName: string; spendUSD: number; productName: string }[];
  unmatched: { campaignName: string; spendUSD: number }[];
}

/** Match Meta campaign names to ERP products using same keywords as X-Delivery */
export function allocateCampaignsToProducts(
  campaigns: CampaignSpendInput[],
  products: MatchableProduct[]
): CampaignAllocationResult {
  const active = products;
  const spendByProduct = new Map<string, number>();
  const matched: CampaignAllocationResult["matched"] = [];
  const unmatched: CampaignAllocationResult["unmatched"] = [];

  for (const campaign of campaigns) {
    const product = matchProduct(campaign.campaignName, active);
    if (product) {
      spendByProduct.set(
        product.id,
        (spendByProduct.get(product.id) ?? 0) + campaign.spendUSD
      );
      matched.push({
        campaignName: campaign.campaignName,
        spendUSD: campaign.spendUSD,
        productName: product.name,
      });
    } else {
      unmatched.push({
        campaignName: campaign.campaignName,
        spendUSD: campaign.spendUSD,
      });
    }
  }

  const allocations = [...spendByProduct.entries()].map(
    ([productId, spendUSD]) => ({
      productId,
      spendUSD: Math.round(spendUSD * 100) / 100,
    })
  );

  return { allocations, matched, unmatched };
}
