import { Router } from "express";
import { z } from "zod";
import type { AdSpendAllocation } from "@ecom-erp/shared";
import {
  getSettings,
  updateSettings,
  getAdSpendAllocation,
  saveAdSpendAllocation,
} from "../repositories/settingsRepository.js";
import { config } from "../config/env.js";

const router = Router();

type AdSpendAllocationEntry = AdSpendAllocation["allocations"][number];

const adSpendAllocationEntrySchema: z.ZodType<AdSpendAllocationEntry> =
  z.object({
    productId: z.string().min(1),
    spendUSD: z.number().min(0),
  });

const saveAdSpendBodySchema = z.object({
  allocations: z.array(adSpendAllocationEntrySchema),
});

router.get("/", async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      data: { ...settings, mockMode: config.useMockProviders },
    });
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        usdToTndRate: z.number().positive().optional(),
        mockMode: z.boolean().optional(),
      })
      .parse(req.body);
    const settings = await updateSettings(body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.get("/ad-spend/:date", async (req, res, next) => {
  try {
    const allocation = await getAdSpendAllocation(req.params.date);
    res.json({ success: true, data: allocation });
  } catch (err) {
    next(err);
  }
});

router.put("/ad-spend/:date", async (req, res, next) => {
  try {
    const body = saveAdSpendBodySchema.parse(req.body);

    const allocation = await saveAdSpendAllocation({
      date: req.params.date,
      allocations: body.allocations,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, data: allocation });
  } catch (err) {
    next(err);
  }
});

export default router;
