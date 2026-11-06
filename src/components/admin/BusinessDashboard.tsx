"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useOrder } from "@/components/orders/OrderProvider";
import { PanelMetric } from "@/components/panels/PanelShell";
import { getProducts } from "@/repositories/catalog.repository";
import { formatPrice } from "@/lib/format";
import { defaultUnitCost, limaDate, shiftDate, stockSummary, summarizeDay, summarizeWeek, weekMonday, type UnitCost } from "@/lib/business-analytics";
import { useAnalyticsSettings } from "./useAnalyticsSettings";
import { DeliverySettingsEditor } from "./DeliverySettingsEditor";

export function BusinessDashboard() {
  const { orders, inventory, hydrated } = useOrder();
  const { settings, save } = useAnalyticsSettings();
  const [selectedDate, setSelectedDate] = useState("");
  const [dailyDate, setDailyDate] = useState("");
  const [includeDemo, setIncludeDemo] = useState(false);
  const [message, setMessage] = useState("");
  const products = getProducts();
  if (!hydrated) return <p role="status">Cargando resumen del negocio...</p>;
  const monday = weekMonday(selectedDate || limaDate(new Date()));
  const summary = summarizeWeek(orders, products, settings, monday, includeDemo);
  const day = dailyDate || limaDate(new Date());
  const daily = summarizeDay(orders, products, settings, day, includeDemo);
  const stock = stockSummary(products, inventory, settings);
  const alerts = [...stock.empty, ...stock.low];
  const maxOrders = Math.max(1, ...summary.days.map(day => day.orders));
  const displayDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });

  return <div className="business-dashboard">
    <div className="analytics-period">
      <div><p className="analytics-eyebrow">REPORTE DIARIO</p><h2>Tu negocio el {displayDate(day)}</h2><p>Cierre diario · hora de Perú · incluye sábados y domingos</p></div>
      <div className="analytics-date-controls">
        <button type="button" aria-label="Día anterior" onClick={() => setDailyDate(shiftDate(day, -1))}>←</button>
        <label>Fecha del reporte<input type="date" value={day} onChange={event => setDailyDate(event.target.value)} /></label>
        <button type="button" aria-label="Día siguiente" onClick={() => setDailyDate(shiftDate(day, 1))}>→</button>
        <button type="button" onClick={() => setDailyDate(limaDate(new Date()))}>Hoy</button>
        <button type="button" onClick={() => {
          const rows = [["Reporte diario Yalaza", day], ["Pedidos registrados", daily.registered], ["Completados", daily.completed], ["Pendientes registrados ese día", daily.pending], ["Ventas de productos", daily.sales], ["Delivery", daily.delivery], ["Total completado", daily.total], ["Costo directo estimado", daily.cost], ["Ganancia bruta estimada", daily.gross], ["Efectivo", daily.payments.cash], ["Yape", daily.payments.yape], ["Tarjeta", daily.payments.card], [], ["Producto", "Unidades", "Ventas"], ...daily.sold.map(item => [item.name, item.quantity, item.sales])];
          const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
          const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
          const link = document.createElement("a"); link.href = url; link.download = `yalaza-reporte-${day}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Descargar CSV</button>
      </div>
    </div>
    <label className="analytics-demo"><input type="checkbox" checked={includeDemo} onChange={event => setIncludeDemo(event.target.checked)} /> Incluir pedidos de demostración en los reportes</label>
    <div className="panel-metrics">
      <PanelMetric label="Ventas completadas del día" value={formatPrice(daily.total)} hint={`${daily.completed} entregados o recogidos · incluye delivery`} icon="check" />
      <PanelMetric label="Pedidos registrados" value={daily.registered} hint={`${daily.pending} pendientes · ${formatPrice(daily.pendingAmount)} por completar`} icon="orders" />
      <PanelMetric label="Ticket promedio" value={formatPrice(daily.average)} hint="Importe por pedido completado" icon="dashboard" />
      <PanelMetric label="Ganancia bruta estimada" value={formatPrice(daily.gross)} hint="Productos menos insumos y envases" icon="stock" />
    </div>
    <p className="analytics-note">Ventas del día según fecha de entrega o recojo, aunque el pedido se registrara antes. Pendientes según fecha de registro. Pagos declarados, sin confirmación bancaria. La ganancia usa costos actuales y no descuenta gastos ni reparto.</p>
    <div className="analytics-main-grid">
      <Card title="Ventas por medio de pago" subtitle={`${daily.deliveryCount} deliveries y ${daily.pickupCount} recojos completados`}>
        <div className="analytics-breakdown"><Amount label="Efectivo" value={daily.payments.cash} /><Amount label="Yape" value={daily.payments.yape} /><Amount label="Tarjeta" value={daily.payments.card} /><Amount label="Total completado" value={daily.total} emphasis /></div>
      </Card>
      <Card title="Lo más vendido del día" subtitle="Usa esta lista para preparar porciones y planificar compras.">
        {daily.sold.length ? <ol className="analytics-ranking">{daily.sold.slice(0, 5).map((item, index) => <li key={item.id}><span>{index + 1}</span><div><strong>{item.name}</strong><p>{item.quantity} unidades</p></div><strong>{formatPrice(item.sales)}</strong></li>)}</ol> : <p className="analytics-note">No hay ventas completadas para esta fecha.</p>}
      </Card>
    </div>
    <div className="analytics-period">
      <div><p className="analytics-eyebrow">PULSO DE LA SEMANA</p><h2>{displayDate(monday)} — {displayDate(shiftDate(monday, 4))}</h2><p>Lunes a viernes · hora de Perú</p></div>
      <div className="analytics-date-controls">
        <button type="button" aria-label="Semana anterior" onClick={() => setSelectedDate(shiftDate(monday, -7))}>←</button>
        <label>Elegir semana<input type="date" value={selectedDate || limaDate(new Date())} onChange={event => setSelectedDate(event.target.value)} /></label>
        <button type="button" aria-label="Semana siguiente" onClick={() => setSelectedDate(shiftDate(monday, 7))}>→</button>
        <button type="button" onClick={() => setSelectedDate(limaDate(new Date()))}>Hoy</button>
      </div>
    </div>
    <label className="analytics-demo"><input type="checkbox" checked={includeDemo} onChange={event => setIncludeDemo(event.target.checked)} /> Incluir pedidos de demostración</label>
    {includeDemo ? <p className="analytics-note">Vista de demostración: las cifras incluyen pedidos de ejemplo.</p> : null}
    <div className="panel-metrics">
      <PanelMetric label="Pedidos registrados" value={summary.count} hint={`${summary.completed} completados · lunes a viernes`} icon="orders" />
      <PanelMetric label="Ventas completadas" value={formatPrice(summary.sales)} hint="Productos de pedidos entregados o recogidos" icon="check" />
      <PanelMetric label="Ganancia bruta estimada" value={formatPrice(summary.gross)} hint={`Margen ${summary.margin.toFixed(1)}% · antes de gastos`} icon="dashboard" />
      <PanelMetric label="Resultado neto estimado" value={formatPrice(summary.net)} hint={`Después de ${formatPrice(settings.weeklyExpenses)} de gastos`} icon="stock" />
    </div>
    <p className="analytics-note">Ventas agrupadas por fecha de registro del pedido, solo cuando está completado. No equivalen a cobros verificados. Costos de ejemplo editables; resultado antes de impuestos, sin ingresos ni costos de reparto.</p>
    {summary.missingCosts ? <p role="alert" className="panel-notice">Hay productos fuera del catálogo sin costo configurado. La ganancia puede estar sobreestimada.</p> : null}

    <div className="analytics-main-grid">
      <Card title="¿Qué día se registran más pedidos?" subtitle="Cantidad registrada por día, incluidas las solicitudes en atención.">
        <div className="analytics-peak"><span>Día con mayor demanda</span><strong>{summary.busiest}</strong></div>
        <div className="analytics-bars" role="img" aria-label={summary.days.map(day => `${day.label}: ${day.orders} pedidos`).join(". ")}>
          {summary.days.map(day => <div key={day.date} className="analytics-bar-column"><strong>{day.orders}</strong><div className="analytics-bar-track"><div className={day.orders === maxOrders ? "is-peak" : ""} style={{ height: `${day.orders / maxOrders * 100}%` }} /></div><span>{day.label.slice(0, 3)}</span><small>{displayDate(day.date)}</small></div>)}
        </div>
      </Card>
      <Card title="De las ventas a la ganancia" subtitle="Estimación para los pedidos completados de la semana seleccionada.">
        <div className="analytics-breakdown">
          <Amount label="Ventas de productos" value={summary.sales} />
          <Amount label="− Insumos y envases" value={summary.cost} />
          <Amount label="Ganancia bruta estimada" value={summary.gross} emphasis />
          <Amount label="− Gastos operativos semanales" value={settings.weeklyExpenses} />
          <Amount label="Resultado neto estimado" value={summary.net} emphasis />
        </div>
        <p className="analytics-note">Importe de todos los pedidos registrados: {formatPrice(summary.registeredAmount)}. Los pendientes todavía no se suman a las ventas completadas.</p>
      </Card>
    </div>

    <Card title="Detalle de lunes a viernes" subtitle="Compara la demanda con las ventas completadas y su costo estimado.">
      <div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>Día</th><th>Pedidos</th><th>Completados</th><th>Ventas</th><th>Costo estimado</th><th>Ganancia bruta</th></tr></thead><tbody>{summary.days.map(day => <tr key={day.date}><th>{day.label} <small>{displayDate(day.date)}</small></th><td>{day.orders}</td><td>{day.completed}</td><td>{formatPrice(day.sales)}</td><td>{formatPrice(day.cost)}</td><td>{formatPrice(day.sales - day.cost)}</td></tr>)}</tbody></table></div>
    </Card>

    <div className="analytics-main-grid">
      <Card title="Inventario que necesita atención" subtitle={`Agotados: ${stock.empty.length} · Stock bajo: ${stock.low.length} · Umbral: ${settings.lowStock} unidades`}>
        {alerts.length ? <ul className="analytics-alert-list">{alerts.map(row => <li key={row.product.id}><div><strong>{row.product.name}</strong><p>Reponer {row.replenish} unidades para llegar a {settings.targetStock}.</p></div><span className={`analytics-status ${row.quantity === 0 ? "is-empty" : "is-low"}`}>{row.quantity === 0 ? "Agotado" : `${row.quantity} restantes`}</span></li>)}</ul> : <div className="analytics-stock-ok"><strong>Inventario sin alertas</strong><p>Todos los productos superan el umbral de reposición.</p></div>}
        <Link href="/admin/stock" className="analytics-link">Revisar y reponer inventario →</Link>
        <p className="analytics-note">Existencias actuales de productos/porciones del catálogo. {stock.units} unidades disponibles; no representa un inventario de ingredientes.</p>
      </Card>
      <Card title="Productos más vendidos" subtitle="Unidades de los pedidos completados en el período.">
        {summary.sold.length ? <ol className="analytics-ranking">{summary.sold.slice(0, 5).map((item, index) => <li key={item.id}><span>{index + 1}</span><div><strong>{item.name}</strong><p>{item.quantity} unidades · margen {item.sales ? ((item.sales - item.cost) / item.sales * 100).toFixed(1) : "0.0"}%</p></div><strong>{formatPrice(item.sales)}</strong></li>)}</ol> : <p className="analytics-note">Todavía no hay pedidos completados en esta semana.</p>}
      </Card>
    </div>

    <Card title="Costos y margen por producto" subtitle="Supuestos de ejemplo: insumos al 45–65% del precio según categoría y envases de S/ 0–0.80. Reemplázalos por tus costos reales.">
      <p className="analytics-note">Costo directo unitario = insumos + envase. Margen bruto = (precio − costo directo) ÷ precio. No incluye gastos operativos ni reparto. Al modificar costos se recalcula toda la semana con los valores actuales.</p>
      {message ? <p role="status" className="panel-notice">{message}</p> : null}
      <details className="analytics-cost-details"><summary>Editar costos de los {products.length} productos</summary>
        <div className="analytics-cost-grid">{products.map(product => {
          const cost = settings.costs[product.id] ?? defaultUnitCost(product);
          return <CostEditor key={`${product.id}-${cost.ingredients}-${cost.packaging}`} name={product.name} price={product.price} cost={cost} custom={Boolean(settings.costs[product.id])} onSave={next => {
            try { save({ ...settings, costs: { ...settings.costs, [product.id]: next } }); setMessage(`Costos de ${product.name} guardados.`); }
            catch { setMessage("No se pudieron guardar los costos en este navegador."); }
          }} />;
        })}</div>
      </details>
      <form key={`${settings.weeklyExpenses}-${settings.lowStock}-${settings.targetStock}`} className="analytics-settings" onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const weeklyExpenses = Number(form.get("expenses")), lowStock = Number(form.get("low")), targetStock = Number(form.get("target"));
        if (!Number.isFinite(weeklyExpenses) || weeklyExpenses < 0 || !Number.isSafeInteger(lowStock) || lowStock < 0 || !Number.isSafeInteger(targetStock) || targetStock <= lowStock) { setMessage("El stock objetivo debe superar el umbral y los importes deben ser válidos."); return; }
        try { save({ ...settings, weeklyExpenses, lowStock, targetStock }); setMessage("Gastos y reglas de reposición guardados."); }
        catch { setMessage("No se pudo guardar la configuración."); }
      }}>
        <label>Gastos de lunes a viernes (S/)<input name="expenses" type="number" min="0" step="0.01" required defaultValue={settings.weeklyExpenses} /><small>Ejemplo inicial: S/ 250 para personal, servicios y alquiler.</small></label>
        <label>Alerta de stock bajo<input name="low" type="number" min="0" step="1" required defaultValue={settings.lowStock} /></label>
        <label>Stock objetivo<input name="target" type="number" min={settings.lowStock + 1} step="1" required defaultValue={settings.targetStock} /></label>
        <button type="submit">Guardar configuración</button>
      </form>
    </Card>
    <DeliverySettingsEditor />
  </div>;
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="analytics-card"><h3>{title}</h3><p className="analytics-subtitle">{subtitle}</p>{children}</section>;
}
function Amount({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return <div className={emphasis ? "is-total" : ""}><span>{label}</span><strong className={value < 0 ? "analytics-negative" : ""}>{formatPrice(value)}</strong></div>;
}
function CostEditor({ name, price, cost, custom, onSave }: { name: string; price: number; cost: UnitCost; custom: boolean; onSave: (cost: UnitCost) => void }) {
  const [ingredients, setIngredients] = useState(String(cost.ingredients));
  const [packaging, setPackaging] = useState(String(cost.packaging));
  const total = Number(ingredients) + Number(packaging);
  return <form className="analytics-cost-item" onSubmit={event => { event.preventDefault(); if (ingredients !== "" && packaging !== "" && Number.isFinite(total) && Number(ingredients) >= 0 && Number(packaging) >= 0) onSave({ ingredients: Number(ingredients), packaging: Number(packaging) }); }}>
    <div><strong>{name}</strong><small>{custom ? "Costo editado" : "Costo de ejemplo"} · Venta {formatPrice(price)}</small></div>
    <div className="analytics-cost-inputs"><label>Insumos (S/)<input required type="number" min="0" step="0.01" value={ingredients} onChange={event => setIngredients(event.target.value)} /></label><label>Envase (S/)<input required type="number" min="0" step="0.01" value={packaging} onChange={event => setPackaging(event.target.value)} /></label></div>
    <p>Costo unitario: <strong>{formatPrice(total)}</strong></p><p className={total > price ? "analytics-negative" : ""}>Ganancia bruta: {formatPrice(price - total)} · Margen {(100 * (price - total) / price).toFixed(1)}%</p>
    <button type="submit">Guardar costo</button>
  </form>;
}
