import { Router } from "express";
import {
  getDailyProfit,
  getDashboardSummary,
  getRecentDailyPerformance,
} from "../services/profitService.js";

const router = Router();

router.get("/:date", async (req, res, next) => {
  try {
    const summary = await getDailyProfit(req.params.date);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;

export const dashboardRouter = Router();

dashboardRouter.get("/today", async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const summary = await getDashboardSummary(today);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/recent", async (_req, res, next) => {
  try {
    const recent = await getRecentDailyPerformance(7);
    res.json({ success: true, data: recent });
  } catch (err) {
    next(err);
  }
});
