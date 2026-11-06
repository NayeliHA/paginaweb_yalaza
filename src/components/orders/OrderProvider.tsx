"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CartItem, CreateOrderInput, CustomerOrder, Product } from "@/models";
import { cloudCommand, useCloudState } from "@/services/cloud-state.service";

interface OrderContextValue {
  inventory: Record<string, number>; orders: CustomerOrder[]; cart: CartItem[]; hydrated: boolean; itemCount: number; subtotal: number;
  addProduct: (product: Product) => void; increase: (id: string) => void; decrease: (id: string) => void; remove: (id: string) => void; clearCart: () => void;
  saveAdminOrder: (input: CreateOrderInput, cart: CartItem[], id?: string) => Promise<CustomerOrder>;
  submitOrder: (input: CreateOrderInput) => Promise<CustomerOrder>;
  deleteAdminOrder: (id: string) => Promise<void>; restoreAdminOrder: (id: string) => Promise<void>; updateStock: (id: string, quantity: number) => Promise<void>;
  acceptOrder: (id: string, name: string) => Promise<CustomerOrder | null>; advanceOrderStatus: (id: string) => Promise<CustomerOrder | null>;
  verifyOrder: (id: string, code: string) => Promise<CustomerOrder | null>; markArrived: (id: string) => Promise<CustomerOrder | null>;
  rateOrder: (id: string, rating: "yes" | "no") => Promise<CustomerOrder | null>; rateCustomer: (id: string, rating: "good" | "regular" | "bad") => Promise<CustomerOrder | null>;
}
const Context = createContext<OrderContextValue | null>(null);
export function OrderProvider({ children }: { children: ReactNode }) {
  const { orders, inventory, hydrated } = useCloudState();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("yalaza:cart:v1") || "[]"); if (Array.isArray(saved)) setCart(saved.filter(item => item?.product?.id && Number.isSafeInteger(item.quantity) && item.quantity > 0)); } catch { /* Empty cart on malformed browser data. */ }
    setCartReady(true);
  }, []);
  useEffect(() => { if (cartReady) try { localStorage.setItem("yalaza:cart:v1", JSON.stringify(cart)); } catch { /* Cart remains usable in memory. */ } }, [cart, cartReady]);
  function addProduct(product: Product) {
    setCart(current => {
      const previous = current.find(item => item.product.id === product.id);
      if (!product.available || (previous?.quantity ?? 0) >= (inventory[product.id] ?? 0)) return current;
      return previous ? current.map(item => item.product.id === product.id ? { product, quantity: item.quantity + 1 } : item) : [...current, { product, quantity: 1 }];
    });
  }
  const value: OrderContextValue = {
    orders, inventory, cart, hydrated: hydrated && cartReady,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0), subtotal: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), addProduct,
    increase: id => { const item = cart.find(item => item.product.id === id); if (item) addProduct(item.product); },
    decrease: id => setCart(current => current.map(item => item.product.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0)),
    remove: id => setCart(current => current.filter(item => item.product.id !== id)), clearCart: () => setCart([]),
    submitOrder: async input => { const order = await cloudCommand<CustomerOrder>("createOrder", input, cart); setCart([]); return order; },
    saveAdminOrder: (input, items, id) => cloudCommand("saveAdminOrder", input, items, id),
    deleteAdminOrder: id => cloudCommand("deleteAdminOrder", id), restoreAdminOrder: id => cloudCommand("restoreAdminOrder", id), updateStock: (id, quantity) => cloudCommand("updateStock", id, quantity),
    acceptOrder: id => cloudCommand("acceptOrder", id), advanceOrderStatus: id => cloudCommand("advanceOrderStatus", id), verifyOrder: (id, code) => cloudCommand("verifyOrder", id, code), markArrived: id => cloudCommand("markArrived", id),
    rateOrder: (id, rating) => cloudCommand("rateOrder", id, rating), rateCustomer: (id, rating) => cloudCommand("rateCustomer", id, rating),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOrder() { const context = useContext(Context); if (!context) throw new Error("useOrder debe usarse dentro de OrderProvider."); return context; }
