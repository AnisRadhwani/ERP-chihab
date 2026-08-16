import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const base = (process.env.XDELIVERY_API_URL ?? "").replace(/\/$/, "");
const key = process.env.XDELIVERY_API_KEY ?? "";
const companyId = process.env.XDELIVERY_COMPANY_ID ?? "";

const candidates = [
  { method: "GET", path: "/parcels" },
  { method: "GET", path: "/parcels/list" },
  { method: "POST", path: "/parcels/list", body: {} },
  { method: "GET", path: "/parcels/delivered" },
  { method: "POST", path: "/parcels/delivered", body: {} },
  { method: "GET", path: "/get-parcels" },
  { method: "POST", path: "/get-parcels", body: {} },
  { method: "POST", path: "/parcels/search", body: { status: "DELIVERED" } },
  { method: "POST", path: "/parcels", body: { uniqueIdentifier: companyId } },
  { method: "GET", path: `/parcels?uniqueIdentifier=${companyId}` },
  { method: "POST", path: "/list-parcels", body: { uniqueIdentifier: companyId } },
  { method: "POST", path: "/parcels/by-date", body: { date: "2026-08-13" } },
];

async function probe() {
  for (const c of candidates) {
    const url = base + c.path;
    try {
      const res = await fetch(url, {
        method: c.method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      const text = await res.text();
      const preview = text.slice(0, 200).replace(/\n/g, " ");
      console.log(`${c.method} ${c.path} → ${res.status} | ${preview}`);
    } catch (e) {
      console.log(`${c.method} ${c.path} → ERROR`, e);
    }
  }
}

probe();
