"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrder } from "@/components/orders/OrderProvider";
import { getProducts } from "@/repositories/catalog.repository";
import { formatPrice } from "@/lib/format";
import type { CustomerOrder, FulfillmentType, PaymentMethod } from "@/models";
import { OrderStatusBadge } from "@/components/panels/PanelShell";

const products = getProducts();
const field = "mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ember";
const action = "rounded-xl bg-ember px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-40";

export function AdminOrderManager({ showForm = true }: { showForm?: boolean }) {
  const { orders, deleteAdminOrder, restoreAdminOrder, hydrated } = useOrder();
  const [editing, setEditing] = useState<CustomerOrder | null>(null);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [activity, setActivity] = useState("all");
  const editableOrder = editing ? orders.find(order => order.id === editing.id && order.active !== false && order.status === "pending") ?? null : null;
  const filtered = orders.filter(order =>
    (activity === "all" || (activity === "inactive" ? order.active === false : order.active !== false)) &&
    `${order.id} ${order.customer.name} ${order.customer.lastName ?? ""}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));

  function remove(orderId: string) {
    try {
      deleteAdminOrder(orderId);
      if (editing?.id === orderId) setEditing(null);
      setDeleting(null);
      setMessage("Pedido inactivo. Se conserva el registro y sus unidades volvieron al stock.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  }

  function restore(orderId: string) {
    try {
      restoreAdminOrder(orderId);
      setMessage("Pedido restaurado y activo. Stock actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo restaurar.");
    }
  }

  return (
    <div className="space-y-6">
      {message ? <p role="status" className="rounded-xl bg-gold/30 p-4 text-sm font-bold">{message}</p> : null}
      {!hydrated ? <p>Cargando clientes y stock...</p> : showForm || editableOrder ? (
        <AdminOrderForm key={`${editableOrder?.id ?? "new"}-${version}`} order={editableOrder}
          onCancel={() => setEditing(null)}
          onSaved={order => {
            setMessage(`Pedido ${order.id} ${editableOrder ? "actualizado" : "registrado"}. Stock actualizado.`);
            setEditing(null);
            setVersion(value => value + 1);
          }} />
      ) : null}
      <section className="rounded-xl border border-ink/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-sans font-semibold text-lg">Pedidos registrados ({orders.length})</h2>
          <label className="text-sm font-bold">Buscar pedido o cliente
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} className={field} />
          </label>
          <label className="text-sm font-bold">Actividad del pedido
            <select value={activity} onChange={event => setActivity(event.target.value)} className={field}>
              <option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 text-ink/60"><tr>
              <th className="p-3">Pedido / cliente</th><th className="p-3">Modalidad</th><th className="p-3">Estado</th><th className="p-3">Actividad</th><th className="p-3">Total</th><th className="p-3">Acciones</th>
            </tr></thead>
            <tbody>{filtered.map(order => (
              <tr key={order.id} className="border-b border-ink/10">
                <td className="p-3"><p className="font-bold">{order.customer.name} {order.customer.lastName}</p><p className="mt-1 text-xs text-ink/55">{order.id}</p><p className="mt-1 text-xs text-ink/55">{order.items.map(item => `${item.quantity} × ${item.name}`).join(", ")}</p></td>
                <td className="p-3">{order.fulfillmentType === "delivery" ? "Delivery" : "Recojo"}</td>
                <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                <td className="p-3"><span className={`rounded-md px-2 py-1 text-xs font-medium ${order.active === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{order.active === false ? "Inactivo" : "Activo"}</span></td>
                <td className="p-3 whitespace-nowrap">{formatPrice(order.total)}</td>
                <td className="p-3">{order.active === false ? <button type="button" className={action} onClick={() => restore(order.id)}>Restaurar</button> : order.status === "pending" ? (
                  deleting === order.id ? <div className="space-y-2"><p>¿Desactivar el pedido y devolver el stock?</p><button type="button" className={action} onClick={() => remove(order.id)}>Sí, desactivar</button><button type="button" className="ml-2 underline" onClick={() => setDeleting(null)}>Cancelar</button></div> :
                    <div className="flex gap-2"><button type="button" className={action} onClick={() => { setEditing(order); setVersion(value => value + 1); }}>Editar</button><button type="button" className="rounded-xl border border-red-700/30 px-3 py-2 text-red-700" onClick={() => setDeleting(order.id)}>Eliminar</button></div>
                ) : <span className="text-xs text-ink/50">En atención / finalizado</span>}</td>
              </tr>
            ))}</tbody>
          </table>
          {!filtered.length ? <p className="py-8 text-center text-ink/60">No hay pedidos con esos filtros.</p> : null}
        </div>
      </section>
    </div>
  );
}

function AdminOrderForm({ order, onSaved, onCancel }: {
  order: CustomerOrder | null;
  onSaved: (order: CustomerOrder) => void;
  onCancel: () => void;
}) {
  const { customers } = useAuth();
  const { inventory, saveAdminOrder } = useOrder();
  const [customerId, setCustomerId] = useState(order?.customer.id ?? "");
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order?.items.map(item => [item.productId, item.quantity]) ?? []));
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(order?.fulfillmentType ?? "pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order?.paymentMethod ?? "cash");
  const [district, setDistrict] = useState(order?.fulfillmentType === "delivery" ? order.fulfillment.district : "");
  const [address, setAddress] = useState(order?.fulfillmentType === "delivery" ? order.fulfillment.address : "");
  const [reference, setReference] = useState(order?.fulfillmentType === "delivery" ? order.fulfillment.reference ?? "" : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const customer = customers.find(item => item.id === customerId);
  const visibleCustomers = customers.filter(item => item.id === customerId ||
    `${item.name} ${item.lastName} ${item.email}`.toLocaleLowerCase("es").includes(customerQuery.toLocaleLowerCase("es")));
  const items = products.filter(product => (quantities[product.id] ?? 0) > 0)
    .map(product => ({ product, quantity: quantities[product.id] }));
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!customer) { setError("Selecciona un cliente registrado."); return; }
    setSaving(true);
    try {
      const saved = saveAdminOrder({
        customer: { id: customer.id, name: customer.name, phone: customer.phone },
        fulfillmentType, paymentMethod,
        delivery: fulfillmentType === "delivery" ? { district, address, reference,
          ...(order?.fulfillmentType === "delivery" ? { latitude: order.fulfillment.latitude, longitude: order.fulfillment.longitude } : {}),
        } : undefined,
      }, items, order?.id);
      onSaved(saved);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-ink/10 bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-sans font-semibold text-lg">{order ? "Editar pedido" : "Registrar pedido"}</h2>
        {order ? <button type="button" onClick={onCancel} className="text-sm font-bold underline">Cancelar edición</button> : null}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Buscar cliente registrado
          <input type="search" value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} placeholder="Nombre, apellido o correo" className={field} />
        </label>
        <label className="text-sm font-bold">Cliente
          <select required value={customerId} onChange={event => setCustomerId(event.target.value)} className={field}>
            <option value="">Selecciona un cliente ({customers.length} registrados)</option>
            {visibleCustomers.map(item => <option key={item.id} value={item.id}>{item.lastName} {item.name} · {item.email}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">Modalidad
          <select value={fulfillmentType} onChange={event => setFulfillmentType(event.target.value as FulfillmentType)} className={field}>
            <option value="pickup">Recojo en local</option><option value="delivery">Delivery</option>
          </select>
        </label>
        <label className="text-sm font-bold">Método de pago
          <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)} className={field}>
            <option value="cash">Efectivo</option><option value="yape">Yape</option><option value="card">Tarjeta</option>
          </select>
        </label>
      </div>
      {customer ? <p className="mt-3 text-sm text-ink/60">{customer.name} {customer.lastName} · {customer.phone} · {customer.email}</p> : null}
      {fulfillmentType === "delivery" ? <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Distrito<input required value={district} onChange={event => setDistrict(event.target.value)} className={field} /></label>
        <label className="text-sm font-bold">Dirección<input required value={address} onChange={event => setAddress(event.target.value)} className={field} /></label>
        <label className="text-sm font-bold md:col-span-2">Referencia<input value={reference} onChange={event => setReference(event.target.value)} className={field} /></label>
      </div> : null}
      <div className="mt-6 border-t border-ink/10 pt-5">
        <label className="text-sm font-bold">Buscar producto
          <input type="search" value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Hamburguesa, alitas, bebida..." className={field} />
        </label>
        <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {products.filter(product => product.name.toLocaleLowerCase("es").includes(productQuery.toLocaleLowerCase("es"))).map(product => {
            const remaining = (inventory[product.id] ?? 0) + (order?.items.find(item => item.productId === product.id)?.quantity ?? 0);
            return <label key={product.id} className="rounded-xl border border-ink/10 bg-[#f8fafc] p-3 text-sm">
              <span className="block font-bold">{product.name}</span>
              <span className="mt-1 block text-xs text-ink/60">{formatPrice(product.price)} · Disponible: {remaining}</span>
              <span className="mt-2 block text-xs font-bold">Cantidad de {product.name}</span>
              <input type="number" min={0} max={remaining} step={1} disabled={!product.available || remaining === 0}
                value={quantities[product.id] ?? 0} onChange={event => setQuantities(current => ({ ...current, [product.id]: Number(event.target.value) }))}
                className={field} />
            </label>;
          })}
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-[#f2f4f7] p-4">
        {items.length ? <ul className="space-y-1 text-sm">{items.map(({product, quantity}) => <li key={product.id}>{quantity} × {product.name} — {formatPrice(product.price * quantity)}</li>)}</ul> : <p className="text-sm text-ink/60">Selecciona al menos un producto.</p>}
        <p className="mt-3 text-lg font-semibold">Total: {formatPrice(total)}</p>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}
      <button type="submit" disabled={saving || !customer || !items.length} className={`${action} mt-5`}>{saving ? "Guardando..." : order ? "Guardar cambios" : "Registrar pedido"}</button>
    </form>
  );
}
