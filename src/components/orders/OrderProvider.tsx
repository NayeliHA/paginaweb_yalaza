"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  CartItem,
  CreateOrderInput,
  CustomerOrder,
  Product,
} from "@/models";
import { orderController } from "@/controllers/order.controller";

interface OrderContextValue {
  cart: CartItem[];
  orders: CustomerOrder[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  addProduct: (product: Product) => void;
  increase: (productId: string) => void;
  decrease: (productId: string) => void;
  remove: (productId: string) => void;
  clearCart: () => void;
  submitOrder: (input: CreateOrderInput) => CustomerOrder;
  acceptOrder: (orderId: string, acceptedBy: string) => CustomerOrder | null;
  advanceOrderStatus: (orderId: string) => CustomerOrder | null;
  verifyOrder: (orderId: string, code: string) => CustomerOrder | null;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { cart, orders, hydrated } = useSyncExternalStore(
    orderController.subscribeToCustomerState,
    orderController.getCustomerState,
    orderController.getServerCustomerState,
  );

  function addProduct(product: Product) {
    if (!product.available) return;
    const existing = cart.find((item) => item.product.id === product.id);
    orderController.saveCart(
      existing
        ? cart.map((item) =>
            item.product.id === product.id
              ? { ...item, product, quantity: item.quantity + 1 }
              : item,
          )
        : [...cart, { product, quantity: 1 }],
    );
  }

  function increase(productId: string) {
    orderController.saveCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decrease(productId: string) {
    orderController.saveCart(
      cart
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function remove(productId: string) {
    orderController.saveCart(cart.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    orderController.saveCart([]);
  }

  function submitOrder(input: CreateOrderInput): CustomerOrder {
    const order = orderController.createOrder(input, cart);
    orderController.saveCart([]);
    return order;
  }

  function acceptOrder(
    orderId: string,
    acceptedBy: string,
  ): CustomerOrder | null {
    return orderController.acceptOrder(orderId, acceptedBy);
  }

  function advanceOrderStatus(orderId: string): CustomerOrder | null {
    return orderController.advanceOrderStatus(orderId);
  }

  function verifyOrder(orderId: string, code: string): CustomerOrder | null {
    return orderController.verifyOrder(orderId, code);
  }

  const value: OrderContextValue = {
    cart,
    orders,
    hydrated,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
    addProduct,
    increase,
    decrease,
    remove,
    clearCart,
    submitOrder,
    acceptOrder,
    advanceOrderStatus,
    verifyOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder debe usarse dentro de OrderProvider.");
  }
  return context;
}
