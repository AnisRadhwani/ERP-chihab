import type { DailyAdSpend } from "@ecom-erp/shared";

export interface MetaAdsProvider {
  readonly providerKey: string;
  testConnection(): Promise<{ ok: boolean; message: string }>;
  getDailySpend(params: { date: string; adAccountId: string }): Promise<DailyAdSpend>;
}

export interface ParcelStatusResult {
  barcode: string;
  status: string;
  motif: string;
}

export interface XDeliveryProvider {
  readonly providerKey: string;
  testConnection(): Promise<{ ok: boolean; message: string }>;
  getParcelStatuses(barcodes: string[]): Promise<ParcelStatusResult[]>;
}
