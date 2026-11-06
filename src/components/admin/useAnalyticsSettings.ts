"use client";

import { type AnalyticsSettings } from "@/lib/business-analytics";
import { useCloudState, cloudCommand } from "@/services/cloud-state.service";

const KEY = "yalaza:analytics:v1";
const EVENT = "yalaza:analytics-change";
function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(EVENT, callback); };
}
function snapshot() { try { return window.localStorage.getItem(KEY); } catch { return null; } }
const serverSnapshot = () => null;

export function useAnalyticsSettings() {
  const { analyticsSettings: settings } = useCloudState();
  async function save(next: AnalyticsSettings) {
    await cloudCommand("saveAnalyticsSettings", next);
  }
  return { settings, save };
}
