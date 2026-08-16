import express from "express";
import cors from "cors";
import { config, isFirebaseConfigured } from "./config/env.js";
import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import importsRouter from "./routes/imports.js";
import settingsRouter from "./routes/settings.js";
import dailyProfitRouter, {
  dashboardRouter,
} from "./routes/daily-profit.js";
import parcelsRouter from "./routes/parcels.js";
import syncRouter from "./routes/sync.js";
import webhooksRouter from "./routes/webhooks.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { startAutoSync } from "./services/autoSync.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/imports", importsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/daily-profit", dailyProfitRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/parcels", parcelsRouter);
app.use("/api/sync", syncRouter);
app.use("/api/webhooks", webhooksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[API] Server running on http://localhost:${config.port}`);
  console.log(`[API] Mock providers: ${config.useMockProviders ? "ON" : "OFF"}`);
  console.log(
    `[API] Firebase: ${isFirebaseConfigured() ? "configured" : "not configured (add credentials to .env)"}`
  );

  if (config.autoSyncEnabled) {
    startAutoSync(config.autoSyncIntervalMs);
  }
});
