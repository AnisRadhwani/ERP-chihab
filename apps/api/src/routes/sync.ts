import { Router } from "express";
import { z } from "zod";
import { syncDay, testIntegrations } from "../services/syncService.js";
import { autoAllocateMetaSpend } from "../services/metaAllocationService.js";
import { getRecentSyncLogs } from "../repositories/syncLogsRepository.js";
import { getDailyAdSpend } from "../repositories/dailyAdSpendRepository.js";
import {
  isMetaConfigured,
  isXDeliveryConfigured,
} from "../providers/registry.js";
import { config } from "../config/env.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .parse(req.body);

    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const result = await syncDay(date);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/integrations", async (_req, res, next) => {
  try {
    const tests = await testIntegrations();
    const logs = await getRecentSyncLogs(5);

    res.json({
      success: true,
      data: {
        mockMode: config.useMockProviders,
        integrations: [
          {
            id: "meta-ads",
            name: "Meta Ads",
            type: "meta_ads",
            configured: isMetaConfigured(),
            status: tests.meta.ok ? "connected" : tests.meta.configured ? "error" : "disconnected",
            message: tests.meta.message,
          },
          {
            id: "xdelivery",
            name: "X-Delivery",
            type: "delivery",
            configured: isXDeliveryConfigured(),
            status: tests.xdelivery.ok ? "connected" : tests.xdelivery.configured ? "error" : "disconnected",
            message: tests.xdelivery.message,
          },
          {
            id: "xdelivery-excel",
            name: "X-Delivery (Excel Import)",
            type: "delivery",
            configured: true,
            status: "connected",
            message: "Import manuel Colis Livrés",
          },
        ],
        recentLogs: logs,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/integrations/test", async (_req, res, next) => {
  try {
    const tests = await testIntegrations();
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
});

router.get("/meta-spend/:date", async (req, res, next) => {
  try {
    const spend = await getDailyAdSpend(req.params.date);
    res.json({ success: true, data: spend ?? null });
  } catch (err) {
    next(err);
  }
});

router.post("/allocate-meta/:date", async (req, res, next) => {
  try {
    const result = await autoAllocateMetaSpend(req.params.date);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
