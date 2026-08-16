import { Router } from "express";
import { config } from "../config/env.js";
import { isFirebaseConfigured } from "../config/env.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      mockMode: config.useMockProviders,
      firebaseConfigured: isFirebaseConfigured(),
    },
  });
});

export default router;
