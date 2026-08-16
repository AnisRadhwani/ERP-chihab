import { syncDay } from "./syncService.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs = 5 * 60 * 1000): void {
  if (intervalId) return;

  console.log(`[AutoSync] Démarré — intervalle ${intervalMs / 1000}s`);

  intervalId = setInterval(async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const result = await syncDay(today);
      console.log(
        `[AutoSync] ${today} — Meta: ${result.meta.status} · X-Delivery: ${result.xdelivery.message ?? result.xdelivery.status}`
      );
    } catch (err) {
      console.error("[AutoSync] Erreur:", err instanceof Error ? err.message : err);
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
