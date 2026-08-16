import { Router } from "express";
import { z } from "zod";
import {
  buildParcelId,
  getParcelByBarcode,
  upsertParcel,
} from "../repositories/parcelsRepository.js";
import { getProduct } from "../repositories/productsRepository.js";
import type { Parcel } from "@ecom-erp/shared";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const body = z
      .object({
        barcode: z.string().min(1),
        productId: z.string().optional(),
        marchandise: z.string().optional(),
        montantTND: z.number().optional(),
      })
      .parse(req.body);

    const existing = await getParcelByBarcode(body.barcode);
    if (existing) {
      res.json({ success: true, data: existing });
      return;
    }

    let productName: string | null = null;
    let matchStatus: "matched" | "unmatched" = "unmatched";
    let montant = body.montantTND ?? 0;

    if (body.productId) {
      const product = await getProduct(body.productId);
      if (product) {
        productName = product.name;
        matchStatus = "matched";
        if (!montant) montant = product.sellingPriceTND;
      }
    }

    const now = new Date().toISOString();
    const parcel: Parcel = {
      id: buildParcelId(body.barcode),
      source: "xdelivery",
      barcode: body.barcode,
      marchandise: body.marchandise ?? `Colis ${body.barcode}`,
      montantTND: montant,
      quantity: 1,
      deliveredDate: "",
      deliveredTime: null,
      productId: body.productId ?? null,
      productNameMatched: productName,
      matchStatus,
      clientName: "",
      phone: "",
      importedAt: now,
      xdeliveryStatus: "CREATED",
      lastSyncedAt: null,
    };

    await upsertParcel(parcel);
    res.status(201).json({ success: true, data: parcel });
  } catch (err) {
    next(err);
  }
});

export default router;
