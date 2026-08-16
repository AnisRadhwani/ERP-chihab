import { Router } from "express";
import multer from "multer";
import { importXDeliveryExcel } from "../services/xdeliveryImportService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls") ||
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel");
    cb(null, ok);
  },
});

const router = Router();

router.post(
  "/xdelivery",
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Fichier Excel requis (.xlsx)",
        });
        return;
      }

      const result = await importXDeliveryExcel(req.file.buffer);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
