import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Monorepo root: apps/api/src/config → 4 levels up
export const MONOREPO_ROOT = path.resolve(__dirname, "../../../..");

// Load .env from monorepo root
dotenv.config({ path: path.join(MONOREPO_ROOT, ".env") });

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  useMockProviders: process.env.USE_MOCK_PROVIDERS === "true",

  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "",
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  },

  meta: {
    accessToken: process.env.META_ACCESS_TOKEN ?? "",
    adAccountId: process.env.META_AD_ACCOUNT_ID ?? "",
  },

  xdelivery: {
    apiKey: process.env.XDELIVERY_API_KEY ?? "",
    apiUrl: process.env.XDELIVERY_API_URL ?? "",
    companyId: process.env.XDELIVERY_COMPANY_ID ?? "",
  },

  autoSyncIntervalMs: parseInt(process.env.AUTO_SYNC_INTERVAL_MS ?? "300000", 10),
  autoSyncEnabled: process.env.AUTO_SYNC_ENABLED !== "false",
} as const;

export function isFirebaseConfigured(): boolean {
  const serviceAccountPath = config.firebase.serviceAccountPath;
  if (serviceAccountPath) {
    const resolved = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(MONOREPO_ROOT, serviceAccountPath);
    return fs.existsSync(resolved);
  }

  return Boolean(
    config.firebase.projectId &&
      config.firebase.clientEmail &&
      config.firebase.privateKey
  );
}
