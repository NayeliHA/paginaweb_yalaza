"use client";

import { useState, useSyncExternalStore } from "react";
import { DELIVERY_EVENT, DELIVERY_KEY, readDeliverySettings } from "@/lib/delivery-settings";

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (!event.key || event.key === DELIVERY_KEY) callback(); };
  window.addEventListener("storage", onStorage); window.addEventListener(DELIVERY_EVENT, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(DELIVERY_EVENT, callback); };
}
function snapshot() { try { return window.localStorage.getItem(DELIVERY_KEY); } catch { return null; } }
export function useDeliverySettings() {
  return readDeliverySettings(useSyncExternalStore(subscribe, snapshot, () => null));
}
export function DeliverySettingsEditor() {
  const settings = useDeliverySettings();
  const [message, setMessage] = useState("");
  return <section className="analytics-card">
    <h3>Delivery personalizado</h3><p className="analytics-subtitle">Configura el costo y el tiempo estimado por distrito. Se aplican a pedidos nuevos de esta demo.</p>
    <form key={JSON.stringify(settings)} onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      const lines = String(data.get("zones")).split("\n").filter(line => line.trim());
      if (lines.some(line => line.split(";").length !== 3 || line.split(";").some(part => !part.trim()))) { setMessage("Usa distrito; costo; minutos en cada línea."); return; }
      const zones = lines.map(line => {
        const [district, fee, minutes] = line.split(";").map(part => part.trim());
        return { district, fee: Number(fee), minutes: Number(minutes) };
      });
      const value = { baseFee: Number(data.get("fee")), minutes: Number(data.get("minutes")), zones };
      const raw = JSON.stringify(value);
      if (JSON.stringify(readDeliverySettings(raw)) !== raw || new Set(zones.map(z => z.district.toLocaleLowerCase("es"))).size !== zones.length) { setMessage("Revisa los importes, minutos y distritos sin repetir."); return; }
      try { window.localStorage.setItem(DELIVERY_KEY, raw); window.dispatchEvent(new Event(DELIVERY_EVENT)); setMessage("Tarifas y tiempos guardados. Los pedidos anteriores conservan su tarifa."); }
      catch { setMessage("No se pudo guardar la configuración."); }
    }} className="space-y-4 mt-4">
      <div className="analytics-settings"><label>Tarifa general (S/)<input name="fee" required type="number" min="0" max="1000" step="0.01" defaultValue={settings.baseFee} /></label><label>Tiempo estimado (min)<input name="minutes" required type="number" min="1" max="1440" step="1" defaultValue={settings.minutes} /></label></div>
      <label className="block text-sm font-semibold">Tarifas por distrito: distrito; costo; minutos<textarea name="zones" rows={4} defaultValue={settings.zones.map(z => `${z.district}; ${z.fee}; ${z.minutes}`).join("\n")} placeholder={"Imperial; 3; 25\nSan Vicente; 5; 40"} className="mt-2 block w-full rounded-xl border border-ink/20 p-3 font-normal" /><small>Una línea por distrito. Los demás usan la tarifa general. Inicialmente el envío es gratis.</small></label>
      <button type="submit" className="rounded-xl bg-ember px-4 py-2 font-bold">Guardar delivery</button>
    </form>{message ? <p role="status" className="panel-notice">{message}</p> : null}
  </section>;
}
