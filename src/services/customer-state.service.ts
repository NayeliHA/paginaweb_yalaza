import type { CartItem, CustomerOrder } from "@/models";
import { customerRepository } from "@/repositories/customer.repository";

export interface CustomerState {
  cart: CartItem[];
  orders: CustomerOrder[];
  hydrated: boolean;
}

const serverState: CustomerState = {
  cart: [],
  orders: [],
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
    orders: customerRepository.loadOrders(),
    hydrated: true,
  };
  initialized = true;
}

function handleStorageChange(): void {
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
  customerRepository.saveOrders(orders);
  state = { ...state, orders, hydrated: true };
  initialized = true;
  notify();
}