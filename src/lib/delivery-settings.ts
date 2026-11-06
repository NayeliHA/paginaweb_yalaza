export interface DeliverySettings { baseFee: number; minutes: number; zones: { district: string; fee: number; minutes: number }[] }
export const DELIVERY_KEY = "yalaza:delivery-settings:v1";
export const DELIVERY_EVENT = "yalaza:delivery-settings-change";
const defaults: DeliverySettings = { baseFee: 0, minutes: 30, zones: [] };
export function readDeliverySettings(raw: string | null): DeliverySettings {
  try {
    const value = JSON.parse(raw || "null");
    const fee = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000;
    const minutes = (n: unknown) => Number.isSafeInteger(n) && Number(n) > 0 && Number(n) <= 1440;
    if (!value || !fee(value.baseFee) || !minutes(value.minutes) || !Array.isArray(value.zones)) return defaults;
    if (value.zones.some((z: DeliverySettings["zones"][number]) => !z || typeof z.district !== "string" || !z.district.trim() || !fee(z.fee) || !minutes(z.minutes))) return defaults;
    return value;
  } catch { return defaults; }
}
export function loadDeliverySettings(): DeliverySettings {
  try { return readDeliverySettings(window.localStorage.getItem(DELIVERY_KEY)); } catch { return defaults; }
}
export function quoteDelivery(district: string, settings = loadDeliverySettings()) {
  const normalize = (s: string) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const zone = settings.zones.find(zone => normalize(zone.district) === normalize(district));
  return { fee: zone?.fee ?? settings.baseFee, minutes: zone?.minutes ?? settings.minutes };
}
