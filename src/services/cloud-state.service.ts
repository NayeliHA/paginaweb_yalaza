"use client";

import { useSyncExternalStore } from "react";
import type { AuthSession, CustomerOrder, RegisteredUser } from "@/models";
import { readDeliverySettings, type DeliverySettings } from "@/lib/delivery-settings";
import { readAnalyticsSettings, type AnalyticsSettings } from "@/lib/business-analytics";

interface CloudState { session: AuthSession | null; users: RegisteredUser[]; orders: CustomerOrder[]; inventory: Record<string, number>; deliverySettings: DeliverySettings; analyticsSettings: AnalyticsSettings; hydrated: boolean; error: string; syncing: boolean }
const initial: CloudState = { session: null, users: [], orders: [], inventory: {}, deliverySettings: readDeliverySettings(null), analyticsSettings: readAnalyticsSettings(null), hydrated: false, error: "", syncing: false };
let state = initial;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let started = false, refreshing = false, mutationCount = 0, generation = 0;
let bearer = "";
const KEY = "yalaza:cloud-token:v1";
function emit(patch: Partial<CloudState>) { state = { ...state, ...patch }; listeners.forEach(listener => listener()); }
async function request(method: string, body?: unknown, accessToken = bearer) {
  const response = await fetch("/api/store/", { method, cache: "no-store", headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "No se pudo sincronizar con el servidor.");
  return value;
}
export async function refreshCloud() {
  if (refreshing || mutationCount) return;
  const version = generation;
  refreshing = true;
  try { const value = await request("GET"); if (version === generation) emit({ ...value, hydrated: true, error: "" }); }
  catch (error) { if (version === generation) emit({ error: error instanceof Error ? error.message : "Sin conexión con el servidor." }); }
  finally { refreshing = false; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    try { bearer = sessionStorage.getItem(KEY) || ""; } catch { /* A session can still work in memory. */ }
  }
  if (!timer) {
    void refreshCloud();
    timer = setInterval(() => { if (document.visibilityState === "visible") void refreshCloud(); }, 2500);
    window.addEventListener("focus", refreshCloud);
    window.addEventListener("online", refreshCloud);
  }
  return () => { listeners.delete(listener); if (!listeners.size && timer) { clearInterval(timer); timer = undefined; window.removeEventListener("focus", refreshCloud); window.removeEventListener("online", refreshCloud); } };
}
export function useCloudState() { return useSyncExternalStore(subscribe, () => state, () => initial); }
export async function cloudCommand<T = void>(action: string, ...args: unknown[]): Promise<T> {
  mutationCount++; generation++;
  emit({ syncing: true, error: "" });
  try {
    const value = await request("POST", { action, args, requestId: crypto.randomUUID() });
    if (value.token || action === "logout") {
      bearer = value.token || "";
      try { if (bearer) sessionStorage.setItem(KEY, bearer); else sessionStorage.removeItem(KEY); } catch { /* Memory-only session. */ }
    }
    emit({ ...value.snapshot, hydrated: true, error: "" });
    return value.result as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el cambio.";
    emit({ error: message }); throw new Error(message);
  } finally { mutationCount--; generation++; emit({ syncing: mutationCount > 0 }); }
}
export function showCloudError(error: unknown) { emit({ error: error instanceof Error ? error.message : "No se pudo guardar el cambio." }); }
