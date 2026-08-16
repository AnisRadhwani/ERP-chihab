import type { DailyAdSpend } from "@ecom-erp/shared";
import type { MetaAdsProvider } from "../types.js";

const GRAPH_VERSION = "v21.0";

export class MetaGraphProvider implements MetaAdsProvider {
  readonly providerKey = "meta";

  constructor(
    private accessToken: string,
    private defaultAccountId: string
  ) {}

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const accountId = this.normalizeAccountId(this.defaultAccountId);
      const url = new URL(
        `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}`
      );
      url.searchParams.set("fields", "name,account_id,currency");
      url.searchParams.set("access_token", this.accessToken);

      const res = await fetch(url);
      const data = (await res.json()) as {
        name?: string;
        error?: { message: string };
      };

      if (!res.ok || data.error) {
        return {
          ok: false,
          message: data.error?.message ?? `HTTP ${res.status}`,
        };
      }

      return { ok: true, message: `Connecté — ${data.name}` };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Erreur Meta API",
      };
    }
  }

  async getDailySpend(params: {
    date: string;
    adAccountId: string;
  }): Promise<DailyAdSpend> {
    const accountId = this.normalizeAccountId(
      params.adAccountId || this.defaultAccountId
    );

    const url = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights`
    );
    url.searchParams.set("fields", "campaign_id,campaign_name,spend,date_start");
    url.searchParams.set(
      "time_range",
      JSON.stringify({ since: params.date, until: params.date })
    );
    url.searchParams.set("level", "campaign");
    url.searchParams.set("access_token", this.accessToken);

    const res = await fetch(url);
    const data = (await res.json()) as {
      data?: Array<{
        campaign_id: string;
        campaign_name: string;
        spend: string;
        date_start: string;
      }>;
      error?: { message: string };
    };

    if (!res.ok || data.error) {
      throw new Error(data.error?.message ?? `Meta API HTTP ${res.status}`);
    }

    const campaigns = (data.data ?? []).map((row) => ({
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      spendUSD: parseFloat(row.spend) || 0,
    }));

    const totalSpendUSD = campaigns.reduce((s, c) => s + c.spendUSD, 0);

    return {
      date: params.date,
      totalSpendUSD: Math.round(totalSpendUSD * 100) / 100,
      accounts: [
        {
          accountId: accountId.replace("act_", ""),
          accountName: accountId,
          spendUSD: Math.round(totalSpendUSD * 100) / 100,
          campaigns,
        },
      ],
    };
  }

  private normalizeAccountId(id: string): string {
    return id.startsWith("act_") ? id : `act_${id}`;
  }
}

export class MockMetaAdsProvider implements MetaAdsProvider {
  readonly providerKey = "meta-mock";

  async testConnection() {
    return { ok: true, message: "Mock Meta connecté" };
  }

  async getDailySpend(params: {
    date: string;
    adAccountId: string;
  }): Promise<DailyAdSpend> {
    return {
      date: params.date,
      totalSpendUSD: 181,
      accounts: [
        {
          accountId: "mock",
          accountName: "Mock Account",
          spendUSD: 181,
          campaigns: [
            {
              campaignId: "1",
              campaignName: "Pull 1 Piece",
              spendUSD: 101,
            },
            { campaignId: "2", campaignName: "Pull 2 Pieces", spendUSD: 80 },
          ],
        },
      ],
    };
  }
}
