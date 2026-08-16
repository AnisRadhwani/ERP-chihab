/**
 * Vercel serverless entrypoint.
 * All /api/* requests are rewritten here (see vercel.json).
 * Express routes remain mounted under /api/... as in local dev.
 */
import { app } from "../apps/api/src/app.js";

export default app;
