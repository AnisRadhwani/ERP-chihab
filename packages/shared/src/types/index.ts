// ─── Product ───

export interface Product {
  id: string;
  name: string;
  buyingPriceTND: number;
  sellingPriceTND: number;
  matchKeywords: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriceSnapshot {
  productId: string;
  buyingPriceTND: number;
  sellingPriceTND: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface CreateProductInput {
  name: string;
  buyingPriceTND: number;
  sellingPriceTND: number;
  matchKeywords?: string[];
  active?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  buyingPriceTND?: number;
  sellingPriceTND?: number;
  matchKeywords?: string[];
  active?: boolean;
}

// ─── Parcels (X-Delivery Excel) ───

export type MatchStatus = "matched" | "unmatched";

export interface Parcel {
  id: string;
  source: "xdelivery";
  barcode: string;
  marchandise: string;
  montantTND: number;
  quantity: number;
  deliveredDate: string;
  deliveredTime: string | null;
  productId: string | null;
  productNameMatched: string | null;
  matchStatus: MatchStatus;
  clientName: string;
  phone: string;
  importedAt: string;
  xdeliveryStatus: string;
  lastSyncedAt: string | null;
}

export interface XDeliveryExcelRow {
  Code: string;
  Client: string;
  Téléphone: string;
  Marchandise: string;
  Montant: number | string;
  "Livré le": string;
  "Heure de livraison"?: string;
}

export interface ImportResult {
  date: string;
  totalRows: number;
  imported: number;
  skipped: number;
  matched: number;
  unmatched: number;
  unmatchedSamples: { barcode: string; marchandise: string }[];
}

// ─── Ad Spend ───

export interface AdSpendAllocation {
  date: string;
  allocations: { productId: string; spendUSD: number }[];
  updatedAt: string;
}

export interface CampaignSpend {
  campaignId: string;
  campaignName: string;
  spendUSD: number;
}

export interface AdAccountSpend {
  accountId: string;
  accountName: string;
  spendUSD: number;
  campaigns: CampaignSpend[];
}

export interface DailyAdSpend {
  date: string;
  totalSpendUSD: number;
  accounts: AdAccountSpend[];
}

export interface SyncLog {
  id: string;
  source: string;
  startedAt: string;
  finishedAt: string | null;
  status: "success" | "failed" | "partial";
  recordsProcessed: number;
  errorMessage: string | null;
}

// ─── Profit ───

export interface ProductDailyProfitRow {
  productId: string;
  productName: string;
  deliveredCount: number;
  adSpendUSD: number;
  adSpendTND: number;
  buyingPriceTND: number;
  sellingPriceTND: number;
  adCostPerOrderTND: number;
  profitPerOrderTND: number;
  totalProfitTND: number;
  revenueTND: number;
  metaCampaigns?: { campaignName: string; spendUSD: number }[];
}

export interface UnmatchedParcelRow {
  barcode: string;
  marchandise: string;
  montantTND: number;
  quantity: number;
}

export interface DailyProfitSummary {
  date: string;
  deliveredCount: number;
  adSpendUSD: number;
  adSpendTND: number;
  metaFetchedSpendUSD: number | null;
  revenueTND: number;
  estimatedNetProfitTND: number;
  usdToTndRate: number;
  products: ProductDailyProfitRow[];
  unmatched: UnmatchedParcelRow[];
  metaCampaigns?: { campaignName: string; spendUSD: number }[];
  unmatchedCampaigns?: { campaignName: string; spendUSD: number }[];
}

// ─── Settings ───

export interface AppSettings {
  usdToTndRate: number;
  defaultCurrency: "TND";
  mockMode: boolean;
  updatedAt: string;
}

// ─── API ───

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
