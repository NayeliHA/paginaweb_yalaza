import type { CartItem, CustomerOrder } from "@/models";
import { getProducts } from "@/repositories/catalog.repository";
import { authRepository } from "@/repositories/auth.repository";
import { createDemoOrders } from "@/lib/demo-orders";

export type Inventory = Record<string, number>;
export interface OrderData { orders: CustomerOrder[]; inventory: Inventory; demoOrdersSeeded?: boolean }

export interface CustomerRepository {
  loadCart(): CartItem[];
  saveCart(items: CartItem[]): void;
  loadOrders(): CustomerOrder[];
  saveOrders(orders: CustomerOrder[]): void;
  loadOrderData(): OrderData;
  saveOrderData(data: OrderData): void;
}

const CART_KEY = "yalaza:cart:v1";
const ORDERS_KEY = "yalaza:orders:v1";
export const ORDER_DATA_KEY = "yalaza:order-data:v2";

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null || !("product" in value)) {
    return false;
  }
  const item = value as { product?: { id?: unknown }; quantity?: unknown };
  return (
    typeof item.product?.id === "string" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function isCustomerOrder(value: unknown): value is CustomerOrder {
  if (typeof value !== "object" || value === null || !("items" in value)) {
    return false;
  }
  const order = value as { id?: unknown; items?: unknown };
  return typeof order.id === "string" && Array.isArray(order.items);
}

export class LocalStorageCustomerRepository implements CustomerRepository {
  loadCart(): CartItem[] {
    const stored = readJson(CART_KEY);
    return Array.isArray(stored) ? stored.filter(isCartItem) : [];
  }

  saveCart(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  loadOrders(): CustomerOrder[] {
    return this.loadOrderData().orders;
  }

  saveOrders(orders: CustomerOrder[]): void {
    this.saveOrderData({ ...this.loadOrderData(), orders });
  }

  loadOrderData(): OrderData {
    const stored = readJson(ORDER_DATA_KEY) as Partial<OrderData> | null;
    const legacy = readJson(ORDERS_KEY);
    const orders = Array.isArray(stored?.orders)
      ? stored.orders.filter(isCustomerOrder)
      : Array.isArray(legacy) ? legacy.filter(isCustomerOrder) : [];
    const inventory: Inventory = {};
    for (const product of getProducts()) {
      const saved = stored?.inventory?.[product.id];
      const previouslyOrdered = orders.reduce((sum, order) =>
        sum + (order.active === false ? 0 : order.items.reduce((count, item) => count + (item.productId === product.id ? item.quantity : 0), 0)), 0);
      inventory[product.id] = typeof saved === "number" && Number.isSafeInteger(saved) && saved >= 0
        ? saved : Math.max(0, 100 - previouslyOrdered);
    }
    let seeded = stored?.demoOrdersSeeded === true;
    let added = false;
    if (!seeded) {
      const examples = createDemoOrders(authRepository.loadUsers(), getProducts());
      for (const example of examples) {
        if (orders.some(order => order.id === example.id)) continue;
        if (!example.items.every(item => inventory[item.productId] >= item.quantity)) continue;
        for (const item of example.items) inventory[item.productId] -= item.quantity;
        orders.push(example);
        added = true;
      }
      seeded = examples.length === 5 && examples.every(example => orders.some(order => order.id === example.id));
    }
    const data = { orders, inventory, demoOrdersSeeded: seeded };
    if (added || !stored || stored.demoOrdersSeeded !== seeded || Object.keys(stored.inventory ?? {}).length !== Object.keys(inventory).length) {
      this.saveOrderData(data);
    }
    return data;
  }

  saveOrderData(data: OrderData): void {
    // A single write commits both records, so an order can never save without its stock change.
    localStorage.setItem(ORDER_DATA_KEY, JSON.stringify(data));
  }
}

export const customerRepository: CustomerRepository =
  new LocalStorageCustomerRepository();
