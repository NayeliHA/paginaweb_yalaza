"use client";

import { useSyncExternalStore } from "react";
import { readAnalyticsSettings, type AnalyticsSettings } from "@/lib/business-analytics";

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
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const settings = readAnalyticsSettings(raw);
  function save(next: AnalyticsSettings) {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }
  return { settings, save };
}
