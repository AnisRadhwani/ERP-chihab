import { app } from "./app.js";
import { config, isFirebaseConfigured } from "./config/env.js";
import { startAutoSync } from "./services/autoSync.js";

/** Local / long-running server — skipped on Vercel serverless */
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`[API] Server running on http://localhost:${config.port}`);
    console.log(
      `[API] Mock providers: ${config.useMockProviders ? "ON" : "OFF"}`
    );
    console.log(
      `[API] Firebase: ${isFirebaseConfigured() ? "configured" : "not configured (add credentials to .env)"}`
    );

    if (config.autoSyncEnabled) {
      startAutoSync(config.autoSyncIntervalMs);
    }
  });
}
