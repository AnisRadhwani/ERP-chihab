import type { XDeliveryProvider, ParcelStatusResult } from "../types.js";

export class XDeliveryApiProvider implements XDeliveryProvider {
  readonly providerKey = "xdelivery";

  constructor(
    private apiKey: string,
    private apiUrl: string
  ) {}

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const url = `${this.apiUrl.replace(/\/$/, "")}/parcels/status`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify([]),
      });

      if (res.status === 401) {
        return { ok: false, message: "Clé API X-Delivery invalide (401)" };
      }

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, message: `X-Delivery HTTP ${res.status}: ${text}` };
      }

      return { ok: true, message: "Connecté à X-Delivery API" };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Erreur X-Delivery",
      };
    }
  }

  async getParcelStatuses(barcodes: string[]): Promise<ParcelStatusResult[]> {
    if (!barcodes.length) return [];

    const url = `${this.apiUrl.replace(/\/$/, "")}/parcels/status`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(barcodes),
    });

    const data = (await res.json()) as
      | Array<{ barcode: string; status: string; motif: string }>
      | { error?: string; message?: string };

    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "message" in data
          ? String(data.message)
          : `HTTP ${res.status}`;
      throw new Error(`X-Delivery: ${msg}`);
    }

    if (!Array.isArray(data)) return [];

    return data.map((row) => ({
      barcode: String(row.barcode),
      status: row.status,
      motif: row.motif ?? "",
    }));
  }
}

export class MockXDeliveryProvider implements XDeliveryProvider {
  readonly providerKey = "xdelivery-mock";

  async testConnection() {
    return { ok: true, message: "Mock X-Delivery connecté" };
  }

  async getParcelStatuses(barcodes: string[]): Promise<ParcelStatusResult[]> {
    return barcodes.map((b) => ({
      barcode: b,
      status: "DELIVERED",
      motif: "",
    }));
  }
}
