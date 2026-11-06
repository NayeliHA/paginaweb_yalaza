import type { CustomerOrder, Product } from "@/models";

export interface UnitCost { ingredients: number; packaging: number }
export interface AnalyticsSettings {
  costs: Record<string, UnitCost>;
  weeklyExpenses: number;
  lowStock: number;
  targetStock: number;
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function netItemSales(order: CustomerOrder): number[] {
  const gross = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const net = money(Math.max(0, gross - (order.discount ?? 0)));
  let accumulated = 0, allocated = 0;
  return order.items.map(item => {
    accumulated += item.unitPrice * item.quantity;
    const next = gross ? money(accumulated / gross * net) : 0;
    const amount = money(next - allocated); allocated = next; return amount;
  });
}

// Illustrative assumptions for the academic prototype, not supplier quotations.
export function defaultUnitCost(product: Product): UnitCost {
  const ratio = product.categoryId === "cat-bebidas" ? 0.65
    : product.categoryId === "cat-extras" ? 0.45 : 0.5;
  return {
    ingredients: money(product.price * ratio),
    packaging: product.categoryId === "cat-bebidas" ? 0 : product.price < 3 ? 0.1 : 0.8,
  };
}

export function readAnalyticsSettings(raw: string | null): AnalyticsSettings {
  const defaults: AnalyticsSettings = { costs: {}, weeklyExpenses: 250, lowStock: 10, targetStock: 30 };
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return defaults;
    const validMoney = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
    const costs: Record<string, UnitCost> = {};
    for (const [id, cost] of Object.entries(data.costs ?? {})) {
      const value = cost as UnitCost | null;
      if (value && validMoney(value.ingredients) && validMoney(value.packaging)) costs[id] = value;
    }
    const lowStock = Number.isSafeInteger(data.lowStock) && data.lowStock >= 0 ? data.lowStock : defaults.lowStock;
    return {
      costs,
      weeklyExpenses: validMoney(data.weeklyExpenses) ? data.weeklyExpenses : defaults.weeklyExpenses,
      lowStock,
      targetStock: Number.isSafeInteger(data.targetStock) && data.targetStock > lowStock ? data.targetStock : Math.max(30, lowStock + 1),
    };
  } catch { return defaults; }
}

export function limaDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function weekMonday(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return shiftDate(date, -(day === 0 ? 6 : day - 1));
}

export function summarizeWeek(orders: CustomerOrder[], products: Product[], settings: AnalyticsSettings, monday: string, includeDemo = false) {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((label, index) => ({
    label, date: shiftDate(monday, index), orders: 0, completed: 0, sales: 0, cost: 0,
  }));
  let registeredAmount = 0;
  const sold = new Map<string, { id: string; name: string; quantity: number; sales: number; cost: number }>();
  let missingCosts = false;
  for (const order of orders) {
    if (order.active === false || (!includeDemo && order.id.startsWith("YZ-DEMO-"))) continue;
    const day = days.find(item => item.date === limaDate(order.createdAt));
    if (!day) continue;
    day.orders++;
    const itemSales = netItemSales(order);
    registeredAmount += itemSales.reduce((sum, amount) => sum + amount, 0);
    if (order.status !== "delivered" && order.status !== "picked_up") continue;
    day.completed++;
    for (const [index, item] of order.items.entries()) {
      const product = products.find(product => product.id === item.productId);
      const unit = settings.costs[item.productId] ?? (product ? defaultUnitCost(product) : undefined);
      if (!unit) missingCosts = true;
      const sales = itemSales[index];
      const cost = money((unit ? unit.ingredients + unit.packaging : 0) * item.quantity);
      day.sales += sales;
      day.cost += cost;
      const previous = sold.get(item.productId) ?? { id: item.productId, name: item.name, quantity: 0, sales: 0, cost: 0 };
      sold.set(item.productId, { ...previous, quantity: previous.quantity + item.quantity, sales: money(previous.sales + sales), cost: money(previous.cost + cost) });
    }
  }
  const count = days.reduce((sum, day) => sum + day.orders, 0);
  const completed = days.reduce((sum, day) => sum + day.completed, 0);
  const sales = money(days.reduce((sum, day) => sum + day.sales, 0));
  const cost = money(days.reduce((sum, day) => sum + day.cost, 0));
  const gross = money(sales - cost);
  const peak = Math.max(...days.map(day => day.orders));
  return { days, count, completed, sales, cost, gross, net: money(gross - settings.weeklyExpenses),
    margin: sales ? gross / sales * 100 : 0, registeredAmount: money(registeredAmount), missingCosts,
    busiest: peak ? days.filter(day => day.orders === peak).map(day => day.label).join(" y ") : "Sin pedidos",
    sold: [...sold.values()].sort((a, b) => b.quantity - a.quantity),
  };
}

export function stockSummary(products: Product[], inventory: Record<string, number>, settings: AnalyticsSettings) {
  const rows = products.map(product => ({ product, quantity: inventory[product.id] ?? 0,
    replenish: Math.max(0, settings.targetStock - (inventory[product.id] ?? 0)) }));
  return { rows, empty: rows.filter(row => row.quantity === 0), low: rows.filter(row => row.quantity > 0 && row.quantity <= settings.lowStock),
    units: rows.reduce((sum, row) => sum + row.quantity, 0) };
}

export function summarizeDay(orders: CustomerOrder[], products: Product[], settings: AnalyticsSettings, date: string, includeDemo = false) {
  const active = orders.filter(order => order.active !== false && (includeDemo || !order.id.startsWith("YZ-DEMO-")));
  const registered = active.filter(order => limaDate(order.createdAt) === date);
  // A daily closing recognizes sales on delivery/collection, including orders placed earlier.
  const completed = active.filter(order => (order.status === "delivered" || order.status === "picked_up") && limaDate(order.verifiedAt || order.createdAt) === date);
  const pending = registered.filter(order => order.status !== "delivered" && order.status !== "picked_up");
  const sold = new Map<string, { id: string; name: string; quantity: number; sales: number }>();
  let sales = 0, cost = 0, delivery = 0;
  const payments: Record<string, number> = { cash: 0, yape: 0, card: 0 };
  for (const order of completed) {
    delivery += order.deliveryFee;
    payments[order.paymentMethod] = (payments[order.paymentMethod] ?? 0) + order.total;
    const itemSales = netItemSales(order);
    for (const [index, item] of order.items.entries()) {
      const product = products.find(product => product.id === item.productId);
      const unit = settings.costs[item.productId] ?? (product ? defaultUnitCost(product) : { ingredients: 0, packaging: 0 });
      const amount = itemSales[index];
      sales += amount;
      cost += (unit.ingredients + unit.packaging) * item.quantity;
      const row = sold.get(item.productId) ?? { id: item.productId, name: item.name, quantity: 0, sales: 0 };
      sold.set(item.productId, { ...row, quantity: row.quantity + item.quantity, sales: money(row.sales + amount) });
    }
  }
  return { registered: registered.length, completed: completed.length, pending: pending.length,
    pendingAmount: money(pending.reduce((sum, order) => sum + order.total, 0)),
    sales: money(sales), cost: money(cost), gross: money(sales - cost), delivery: money(delivery),
    total: money(sales + delivery), average: completed.length ? money((sales + delivery) / completed.length) : 0,
    deliveryCount: completed.filter(order => order.fulfillmentType === "delivery").length,
    pickupCount: completed.filter(order => order.fulfillmentType === "pickup").length,
    payments, sold: [...sold.values()].sort((a, b) => b.quantity - a.quantity) };
}
