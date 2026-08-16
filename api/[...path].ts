/**
 * Vercel catch-all for /api/* (health, products, sync, …).
 * Express routes remain mounted under /api/... as in local dev.
 */
import { app } from "../apps/api/src/app.js";

export default app;
