import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const base = (process.env.XDELIVERY_API_URL ?? "").replace(/\/$/, "");
const key = process.env.XDELIVERY_API_KEY ?? "";
const uid = process.env.XDELIVERY_COMPANY_ID ?? "";

const candidates = [
  { method: "POST", path: "/get-parcels", body: { uniqueIdentifier: uid } },
  { method: "POST", path: "/list-parcel", body: { uniqueIdentifier: uid } },
  { method: "POST", path: "/list-parcels", body: { uniqueIdentifier: uid } },
  { method: "POST", path: "/parcels/get", body: { uniqueIdentifier: uid } },
  { method: "POST", path: "/colis/list", body: { uniqueIdentifier: uid } },
  { method: "POST", path: "/colis/livres", body: { uniqueIdentifier: uid, date: "2026-08-13" } },
  { method: "POST", path: "/export-parcels", body: { uniqueIdentifier: uid, status: "DELIVERED" } },
  { method: "POST", path: "/parcels/status/all", body: { uniqueIdentifier: uid } },
  { method: "GET", path: `/parcels/status/all?uniqueIdentifier=${uid}` },
];

async function probe() {
  for (const c of candidates) {
    const url = base + c.path;
    try {
      const res = await fetch(url, {
        method: c.method,
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      const text = await res.text();
      console.log(`${c.method} ${c.path} → ${res.status} | ${text.slice(0, 300)}`);
    } catch (e) {
      console.log(`${c.method} ${c.path} → ERROR`, e);
    }
  }
}

probe();
