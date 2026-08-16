import { config } from "../config/env.js";
import {
  MetaGraphProvider,
  MockMetaAdsProvider,
} from "./meta/MetaGraphProvider.js";
import {
  XDeliveryApiProvider,
  MockXDeliveryProvider,
} from "./xdelivery/XDeliveryApiProvider.js";
import type { MetaAdsProvider, XDeliveryProvider } from "./types.js";

export function getMetaAdsProvider(): MetaAdsProvider {
  if (config.useMockProviders || !config.meta.accessToken) {
    return new MockMetaAdsProvider();
  }
  return new MetaGraphProvider(
    config.meta.accessToken,
    config.meta.adAccountId
  );
}

export function getXDeliveryProvider(): XDeliveryProvider {
  if (config.useMockProviders || !config.xdelivery.apiKey) {
    return new MockXDeliveryProvider();
  }
  return new XDeliveryApiProvider(
    config.xdelivery.apiKey,
    config.xdelivery.apiUrl
  );
}

export function isMetaConfigured(): boolean {
  return Boolean(config.meta.accessToken && config.meta.adAccountId);
}

export function isXDeliveryConfigured(): boolean {
  return Boolean(config.xdelivery.apiKey && config.xdelivery.apiUrl);
}
