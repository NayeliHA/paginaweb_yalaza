import type { CartItem, CustomerOrder } from "@/models";

export interface CustomerRepository {
  loadCart(): CartItem[];
  saveCart(items: CartItem[]): void;
  loadOrders(): CustomerOrder[];
  saveOrders(orders: CustomerOrder[]): void;
}

const CART_KEY = "yalaza:cart:v1";
const ORDERS_KEY = "yalaza:orders:v1";

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
    const stored = readJson(ORDERS_KEY);
    return Array.isArray(stored) ? stored.filter(isCustomerOrder) : [];
  }

  saveOrders(orders: CustomerOrder[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export const customerRepository: CustomerRepository =
  new LocalStorageCustomerRepository();