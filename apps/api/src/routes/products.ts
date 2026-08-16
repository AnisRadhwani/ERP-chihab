import { Router } from "express";
import { z } from "zod";
import {
  listProducts,
  createProduct,
  updateProduct,
  getProduct,
} from "../repositories/productsRepository.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  buyingPriceTND: z.number().min(0),
  sellingPriceTND: z.number().min(0),
  matchKeywords: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

router.get("/", async (_req, res, next) => {
  try {
    const products = await listProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, error: "Produit introuvable" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const product = await createProduct({
      name: body.name,
      buyingPriceTND: body.buyingPriceTND,
      sellingPriceTND: body.sellingPriceTND,
      matchKeywords: body.matchKeywords ?? [body.name],
      active: body.active ?? true,
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const product = await updateProduct(req.params.id, body);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

export default router;
