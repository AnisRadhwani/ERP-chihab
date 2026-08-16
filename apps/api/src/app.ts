import express from "express";
import cors from "cors";
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

function getCorsOrigins(): string[] {
  const origins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
  ]);

  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  return [...origins];
}

export const app = express();

app.use(
  cors({
    origin: getCorsOrigins(),
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

export default app;
