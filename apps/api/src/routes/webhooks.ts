import { Router } from "express";
import { config } from "../config/env.js";
import { handleXDeliveryWebhook } from "../services/xdeliveryLiveService.js";

const router = Router();

router.post("/xdelivery", async (req, res, next) => {
  try {
    const auth = req.headers.authorization ?? "";
    const expected = `Bearer ${config.xdelivery.apiKey}`;

    if (auth !== expected) {
      res.status(401).json({ success: false, error: "Unauthorized webhook" });
      return;
    }

    const { barcode, status, motif } = req.body as {
      barcode?: number | string;
      status?: string;
      motif?: string;
    };

    if (!barcode || !status) {
      res.status(400).json({ success: false, error: "barcode et status requis" });
      return;
    }

    const parcel = await handleXDeliveryWebhook({ barcode, status, motif });
    res.json({ success: true, data: { barcode: parcel.barcode, status: parcel.xdeliveryStatus } });
  } catch (err) {
    next(err);
  }
});

export default router;
