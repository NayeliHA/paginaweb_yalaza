"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelMetric, PanelEmpty } from "@/components/panels/PanelShell";
import { useOrder } from "@/components/orders/OrderProvider";
import { getCategories, getProducts } from "@/repositories/catalog.repository";
import { stockSummary } from "@/lib/business-analytics";
import { useAnalyticsSettings } from "./useAnalyticsSettings";

export function AdminStock() {
  const { inventory, updateStock, hydrated } = useOrder();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("all");
  const { settings } = useAnalyticsSettings();
  const products = getProducts();
  const stock = stockSummary(products, inventory, settings);
  const visible = products.filter(product => (category === "all" || product.categoryId === category) &&
    (status === "all" || (status === "empty" ? inventory[product.id] === 0 : (inventory[product.id] ?? 0) > 0 && inventory[product.id] <= settings.lowStock)) &&
    product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));

  if (!hydrated) return <p role="status">Cargando inventario...</p>;

  return <div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PanelMetric label="Productos" value={products.length} hint="En tu catálogo" icon="stock" />
      <PanelMetric label="Unidades disponibles" value={Object.values(inventory).reduce((sum, count) => sum + count, 0)} hint="Stock actual" icon="orders" />
      <PanelMetric label="Productos agotados" value={stock.empty.length} hint="Sin unidades disponibles" icon="pickup" />
      <PanelMetric label="Stock bajo" value={stock.low.length} hint={`De 1 a ${settings.lowStock} unidades`} icon="stock" />
    </div>
    <section className="analytics-card mt-5">
      <h2 className="text-lg font-semibold">Plan de reposición</h2>
      <p className="analytics-subtitle">Prioriza los agotados y repón hasta {settings.targetStock} unidades por producto. Cambia el umbral y el objetivo en el resumen del negocio.</p>
      {[...stock.empty, ...stock.low].length ? <ul className="analytics-alert-list">{[...stock.empty, ...stock.low].map(row => <li key={row.product.id}><div><strong>{row.product.name}</strong><p>{row.quantity} disponibles · Reponer {row.replenish} unidades</p></div><span className={`analytics-status ${row.quantity === 0 ? "is-empty" : "is-low"}`}>{row.quantity === 0 ? "Agotado" : "Stock bajo"}</span></li>)}</ul> : <p className="analytics-stock-ok">Todos los productos tienen existencias por encima del umbral.</p>}
    </section>
    <div className="mt-6 flex flex-wrap gap-4">
      <label className="text-sm font-bold">Buscar producto<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold">Categoría<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink"><option value="all">Todas</option>{getCategories().map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">Estado<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink"><option value="all">Todos</option><option value="empty">Agotados</option><option value="low">Stock bajo</option></select></label>
    </div>
    {message ? <p role="status" className="mt-4 rounded-xl bg-gold/30 p-3 text-sm font-bold">{message}</p> : null}
    {!hydrated ? <p className="mt-5">Cargando stock...</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(product => <StockItem key={`${product.id}-${inventory[product.id]}`} name={product.name} image={product.image} quantity={inventory[product.id] ?? 0} threshold={settings.lowStock}
        onSave={quantity => {
          try { updateStock(product.id, quantity); setMessage(`Stock de ${product.name} actualizado a ${quantity}.`); }
          catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); }
        }} />)}
    </div>}
    {hydrated && !visible.length ? <PanelEmpty title="Sin coincidencias" description="Prueba otro nombre o cambia la categoría." /> : null}
  </div>;
}

function StockItem({ name, image, quantity, threshold, onSave }: { name: string; image?: string; quantity: number; threshold: number; onSave: (quantity: number) => void }) {
  const [value, setValue] = useState(String(quantity));
  return <form onSubmit={event => { event.preventDefault(); onSave(Number(value)); }} className="rounded-xl border border-ink/10 bg-white p-5">
    <div className="flex items-center gap-3">
      {image ? <Image src={image} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : null}
      <h2 className="text-base font-semibold">{name}</h2>
    </div>
    <p className={`mt-3 font-semibold ${quantity === 0 ? "text-red-700" : quantity <= threshold ? "text-amber-700" : "text-green-800"}`}>{quantity} unidades · {quantity === 0 ? "Agotado" : quantity <= threshold ? "Stock bajo" : "Disponible"}</p>
    <label className="mt-4 block text-sm font-bold">Stock de {name}<input required type="number" min={0} step={1} value={value} onChange={event => setValue(event.target.value)} className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
    <button type="submit" disabled={Number(value) === quantity} className="mt-3 rounded-xl bg-ember px-4 py-2 text-sm font-bold disabled:opacity-40">Actualizar stock</button>
  </form>;
}
