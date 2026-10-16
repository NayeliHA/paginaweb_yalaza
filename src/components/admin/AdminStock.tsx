"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelMetric, PanelEmpty } from "@/components/panels/PanelShell";
import { useOrder } from "@/components/orders/OrderProvider";
import { getCategories, getProducts } from "@/repositories/catalog.repository";

export function AdminStock() {
  const { inventory, updateStock, hydrated } = useOrder();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const products = getProducts();
  const visible = products.filter(product => (category === "all" || product.categoryId === category) &&
    product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));

  return <div>
    <div className="grid gap-4 sm:grid-cols-3">
      <PanelMetric label="Productos" value={products.length} hint="En tu catálogo" icon="stock" />
      <PanelMetric label="Unidades disponibles" value={Object.values(inventory).reduce((sum, count) => sum + count, 0)} hint="Stock actual" icon="orders" />
      <PanelMetric label="Productos agotados" value={products.filter(product => inventory[product.id] === 0).length} hint="Requieren reposición" icon="pickup" />
    </div>
    <div className="mt-6 flex flex-wrap gap-4">
      <label className="text-sm font-bold">Buscar producto<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink" /></label>
      <label className="text-sm font-bold">Categoría<select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 block rounded-xl border border-ink/20 bg-white px-3 py-2 text-ink"><option value="all">Todas</option>{getCategories().map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
    {message ? <p role="status" className="mt-4 rounded-xl bg-gold/30 p-3 text-sm font-bold">{message}</p> : null}
    {!hydrated ? <p className="mt-5">Cargando stock...</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(product => <StockItem key={`${product.id}-${inventory[product.id]}`} name={product.name} image={product.image} quantity={inventory[product.id] ?? 0}
        onSave={quantity => {
          try { updateStock(product.id, quantity); setMessage(`Stock de ${product.name} actualizado a ${quantity}.`); }
          catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); }
        }} />)}
    </div>}
    {hydrated && !visible.length ? <PanelEmpty title="Sin coincidencias" description="Prueba otro nombre o cambia la categoría." /> : null}
  </div>;
}

function StockItem({ name, image, quantity, onSave }: { name: string; image?: string; quantity: number; onSave: (quantity: number) => void }) {
  const [value, setValue] = useState(String(quantity));
  return <form onSubmit={event => { event.preventDefault(); onSave(Number(value)); }} className="rounded-xl border border-ink/10 bg-white p-5">
    <div className="flex items-center gap-3">
      {image ? <Image src={image} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : null}
      <h2 className="text-base font-semibold">{name}</h2>
    </div>
    <p className={`mt-3 font-semibold ${quantity === 0 ? "text-red-700" : quantity <= 10 ? "text-amber-700" : "text-green-800"}`}>{quantity} unidades · {quantity === 0 ? "Agotado" : quantity <= 10 ? "Stock bajo" : "Disponible"}</p>
    <label className="mt-4 block text-sm font-bold">Stock de {name}<input required type="number" min={0} step={1} value={value} onChange={event => setValue(event.target.value)} className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-ink" /></label>
    <button type="submit" disabled={Number(value) === quantity} className="mt-3 rounded-xl bg-ember px-4 py-2 text-sm font-bold disabled:opacity-40">Actualizar stock</button>
  </form>;
}
