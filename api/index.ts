/**
 * Vercel serverless entrypoint (CJS bundle) loading the ESM Express app via dynamic import.
 * Static import would cause: ERR_REQUIRE_ESM from api/index.js → apps/api/dist/app.js
 */
import type { Request, Response } from "express";

type ExpressApp = (req: Request, res: Response) => void;

let cachedApp: ExpressApp | null = null;

async function loadApp(): Promise<ExpressApp> {
  if (cachedApp) return cachedApp;

  const mod = await import("../apps/api/dist/app.js");
  const app = (mod.app ?? mod.default) as ExpressApp;
  cachedApp = app;
  return app;
}

export default async function handler(req: Request, res: Response) {
  const app = await loadApp();
  return app(req, res);
}
