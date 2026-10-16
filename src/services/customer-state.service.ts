import type { CartItem, CustomerOrder } from "@/models";
import { customerRepository, type Inventory, ORDER_DATA_KEY } from "@/repositories/customer.repository";

export interface CustomerState {
  cart: CartItem[];
  orders: CustomerOrder[];
  inventory: Inventory;
  hydrated: boolean;
}

const serverState: CustomerState = {
  cart: [],
  orders: [],
  inventory: {},
  hydrated: false,
};

let state = serverState;
let initialized = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadFromStorage(): void {
  state = {
    cart: customerRepository.loadCart(),
    ...customerRepository.loadOrderData(),
    hydrated: true,
  };
  initialized = true;
}

function handleStorageChange(event: StorageEvent): void {
  if (event.key !== null && event.key !== ORDER_DATA_KEY && event.key !== "yalaza:cart:v1") return;
  loadFromStorage();
  notify();
}

export function getCustomerSnapshot(): CustomerState {
  return state;
}

export function getServerCustomerSnapshot(): CustomerState {
  return serverState;
}

export function subscribeToCustomerState(listener: () => void): () => void {
  if (typeof window !== "undefined" && !initialized) loadFromStorage();
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

export function saveCustomerCart(cart: CartItem[]): void {
  customerRepository.saveCart(cart);
  state = { ...state, cart, hydrated: true };
  initialized = true;
  notify();
}

export function saveCustomerOrders(orders: CustomerOrder[]): void {
  const latest = customerRepository.loadOrderData();
  customerRepository.saveOrderData({ ...latest, orders });
  state = { ...state, ...latest, orders, hydrated: true };
  initialized = true;
  notify();
}

export function commitOrderChange(order: CustomerOrder | null, previousId?: string, restoring = false): void {
  const latest = customerRepository.loadOrderData();
  const previous = previousId ? latest.orders.find(item => item.id === previousId) : undefined;
  if (previousId && !previous) throw new Error("Este pedido ya no existe. Actualiza la lista.");
  if (!order && previous?.active === false) return;
  if (restoring && previous?.active !== false) return;
  if (order && previous?.active === false && !restoring) throw new Error("Restaura el pedido antes de editarlo.");
  if (previous && previous.status !== "pending") {
    throw new Error("Solo se pueden editar o eliminar pedidos pendientes.");
  }
  const inventory = { ...latest.inventory };
  for (const item of previous?.active === false ? [] : previous?.items ?? []) inventory[item.productId] += item.quantity;
  for (const item of order?.items ?? []) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new Error("La cantidad debe ser un entero positivo.");
    if ((inventory[item.productId] ?? 0) < item.quantity) {
      throw new Error(`Stock insuficiente de ${item.name}: quedan ${inventory[item.productId] ?? 0} unidades.`);
    }
    inventory[item.productId] -= item.quantity;
  }
  const remaining = latest.orders.filter(item => item.id !== previousId);
  const saved = order ?? (previous ? { ...previous, active: false, deactivatedAt: new Date().toISOString() } : null);
  const orders = saved ? [saved, ...remaining] : remaining;
  customerRepository.saveOrderData({ ...latest, orders, inventory });
  state = { ...state, orders, inventory, hydrated: true };
  initialized = true;
  notify();
}

export function saveInventory(productId: string, quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Ingresa un stock entero de cero o más.");
  const latest = customerRepository.loadOrderData();
  if (!(productId in latest.inventory)) throw new Error("Producto no encontrado.");
  const inventory = { ...latest.inventory, [productId]: quantity };
  customerRepository.saveOrderData({ ...latest, inventory });
  state = { ...state, ...latest, inventory, hydrated: true };
  initialized = true;
  notify();
}
