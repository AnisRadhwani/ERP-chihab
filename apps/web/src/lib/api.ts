import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  DailyProfitSummary,
  AppSettings,
  AdSpendAllocation,
  ImportResult,
} from "@ecom-erp/shared";
import { apiGet, apiPost, apiPut, apiUpload } from "./apiClient";

export const productsApi = {
  list: () => apiGet<Product[]>("/api/products"),
  create: (data: CreateProductInput) => apiPost<Product>("/api/products", data),
  update: (id: string, data: UpdateProductInput) =>
    apiPut<Product>(`/api/products/${id}`, data),
};

export const importsApi = {
  xdelivery: (file: File) =>
    apiUpload<ImportResult>("/api/imports/xdelivery", file),
};

export const settingsApi = {
  get: () => apiGet<AppSettings>("/api/settings"),
  update: (data: Partial<AppSettings>) =>
    apiPut<AppSettings>("/api/settings", data),
  getAdSpend: (date: string) =>
    apiGet<AdSpendAllocation | null>(`/api/settings/ad-spend/${date}`),
  saveAdSpend: (date: string, allocations: AdSpendAllocation["allocations"]) =>
    apiPut<AdSpendAllocation>(`/api/settings/ad-spend/${date}`, { allocations }),
};

export const profitApi = {
  getDaily: (date: string) =>
    apiGet<DailyProfitSummary>(`/api/daily-profit/${date}`),
};

export const syncApi = {
  syncNow: (date?: string) =>
    apiPost<{
      date: string;
      meta: { status: string; totalSpendUSD: number | null; message: string | null };
      xdelivery: {
        status: string;
        barcodesChecked: number;
        deliveredConfirmed: number;
        message: string | null;
      };
    }>("/api/sync", { date }),
  getIntegrations: () =>
    apiGet<{
      mockMode: boolean;
      integrations: Array<{
        id: string;
        name: string;
        type: string;
        configured: boolean;
        status: string;
        message: string;
      }>;
      recentLogs: Array<{
        id: string;
        source: string;
        status: string;
        recordsProcessed: number;
        errorMessage: string | null;
        startedAt: string;
      }>;
    }>("/api/sync/integrations"),
  testConnections: () =>
    apiPost<{
      meta: { ok: boolean; message: string; configured: boolean };
      xdelivery: { ok: boolean; message: string; configured: boolean };
    }>("/api/sync/integrations/test", {}),
  getMetaSpend: (date: string) =>
    apiGet<{
      date: string;
      totalSpendUSD: number;
      accounts: Array<{
        campaigns: Array<{ campaignName: string; spendUSD: number }>;
      }>;
    } | null>(`/api/sync/meta-spend/${date}`),
  allocateMeta: (date: string) =>
    apiPost<{
      allocations: Array<{ productId: string; spendUSD: number }>;
      matched: Array<{ campaignName: string; spendUSD: number; productName: string }>;
      unmatched: Array<{ campaignName: string; spendUSD: number }>;
      totalSpendUSD: number;
    }>(`/api/sync/allocate-meta/${date}`, {}),
};

export const dashboardApi = {
  today: () =>
    apiGet<{
      date: string;
      deliveredCount: number;
      adSpendUSD: number;
      revenueTND: number;
      estimatedNetProfitTND: number;
    }>("/api/dashboard/today"),
  recent: () => apiGet<DailyProfitSummary[]>("/api/dashboard/recent"),
};
