"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelMetric, PanelEmpty } from "@/components/panels/PanelShell";
import { useOrder } from "@/components/orders/OrderProvider";
import { getCategories, getProducts } from "@/repositories/catalog.repository";
import { stockSummary } from "@/lib/business-analytics";
import { useAnalyticsSettings } from "./useAnalyticsSettings";
import { useCloudState, cloudCommand } from "@/services/cloud-state.service";
import type { Product } from "@/models";

export function AdminStock() {
  const { inventory, updateStock, hydrated } = useOrder();
  const cloud = useCloudState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("all");
  const { settings } = useAnalyticsSettings();
  const products = cloud.products.length ? cloud.products : getProducts();
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
    <ProductEditor products={products} ingredientInventory={cloud.ingredientInventory ?? {}} />
    <div className="mt-6 flex flex-wrap gap-4">
      <label className="text-sm font-bold">Buscar producto<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold">Categoría<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink"><option value="all">Todas</option>{getCategories().map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">Estado<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink"><option value="all">Todos</option><option value="empty">Agotados</option><option value="low">Stock bajo</option></select></label>
    </div>
    {message ? <p role="status" className="mt-4 rounded-xl bg-gold/30 p-3 text-sm font-bold">{message}</p> : null}
    {!hydrated ? <p className="mt-5">Cargando stock...</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(product => <StockItem key={`${product.id}-${inventory[product.id]}`} name={product.name} image={product.image} quantity={inventory[product.id] ?? 0} threshold={settings.lowStock}
        onSave={async quantity => {
          try { await updateStock(product.id, quantity); setMessage(`Stock de ${product.name} actualizado a ${quantity}.`); }
          catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); }
        }} />)}
    </div>}
    {hydrated && !visible.length ? <PanelEmpty title="Sin coincidencias" description="Prueba otro nombre o cambia la categoría." /> : null}
  </div>;
}

function ProductEditor({ products, ingredientInventory }: { products: Product[]; ingredientInventory: Record<string, number> }) {
  const [selected, setSelected] = useState(products[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const product = products.find(item => item.id === selected) ?? products[0];
  if (!product) return null;
  const ingredients = product.ingredients ?? [];
  async function save(form: FormData) {
    if (!product) return;
    try {
      const parsed = String(form.get("ingredients") ?? "").split("\n").map(line => line.trim()).filter(Boolean).map(line => {
        const [name, rawQuantity, unit] = line.split("|").map(value => value.trim());
        return { name, quantity: Number(rawQuantity), unit };
      });
      await cloudCommand("saveProduct", { ...product, name: String(form.get("name")), description: String(form.get("description")), price: Number(form.get("price")), ingredients: parsed });
      setNotice("Plato actualizado. El menú y el inventario ya muestran los cambios.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo guardar el plato."); }
  }
  async function setIngredientStock(name: string, value: number) {
    try { await cloudCommand("updateIngredientStock", name, value); setNotice(`Stock de ${name} actualizado.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo actualizar el ingrediente."); }
  }
  return <section className="analytics-card mt-6">
    <h2 className="text-lg font-semibold">Platos, ingredientes y stock</h2>
    <p className="analytics-subtitle">Edita la receta y el precio. El stock de ingredientes se comparte entre todos los platos que los usan y se descuenta al registrar un pedido.</p>
    {notice ? <p role="status" className="mt-3 rounded-xl bg-gold/30 p-3 text-sm font-bold">{notice}</p> : null}
    <label className="mt-4 block text-sm font-bold">Plato<select value={product.id} onChange={event => setSelected(event.target.value)} className="mt-1 block w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink">{products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <form action={save} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="text-sm font-bold">Nombre<input name="name" required defaultValue={product.name} key={`${product.id}-name`} className="mt-1 block w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold">Precio (S/)<input name="price" type="number" min="0" max="10000" step="0.01" required defaultValue={product.price} key={`${product.id}-price`} className="mt-1 block w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold md:col-span-2">Descripción<textarea name="description" rows={2} defaultValue={product.description} key={`${product.id}-description`} className="mt-1 block w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold md:col-span-2">Ingredientes por plato<textarea name="ingredients" rows={4} defaultValue={ingredients.map(item => `${item.name} | ${item.quantity} | ${item.unit}`).join("\n")} key={`${product.id}-ingredients`} placeholder="Pollo | 6 | piezas" className="mt-1 block w-full rounded-xl border border-ink/20 px-3 py-2 font-normal text-ink" /><span className="font-normal text-ink/60">Una línea por ingrediente: nombre | cantidad | unidad. Ejemplo: Pollo | 6 | piezas</span></label>
      <button className="rounded-xl bg-ember px-4 py-2 text-sm font-bold md:col-span-2">Guardar cambios del plato</button>
    </form>
    {ingredients.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{ingredients.map(item => {
      const key = item.name.toLocaleLowerCase("es");
      return <IngredientStock key={`${product.id}-${key}`} name={item.name} unit={item.unit} quantity={ingredientInventory[key] ?? 0} onSave={value => setIngredientStock(item.name, value)} />;
    })}</div> : <p className="mt-4 rounded-xl bg-gold/20 p-3 text-sm">Este plato aún no tiene ingredientes registrados. Añádelos arriba para controlar su stock.</p>}
  </section>;
}

function IngredientStock({ name, unit, quantity, onSave }: { name: string; unit: string; quantity: number; onSave: (value: number) => void }) {
  const [value, setValue] = useState(String(quantity));
  return <form onSubmit={event => { event.preventDefault(); onSave(Number(value)); }} className="flex items-end gap-2 rounded-xl border border-ink/10 bg-white p-3">
    <label className="min-w-0 flex-1 text-sm font-bold">Stock de {name} ({unit})<input type="number" min="0" step="0.01" required value={value} onChange={event => setValue(event.target.value)} className="mt-1 block w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
    <button className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white">Guardar</button>
  </form>;
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
