import type {
  CartItem,
  CreateOrderInput,
  CustomerOrder,
} from "@/models";
import type { OrderStatusObserver } from "@/patterns/behavioral/order-status-observer";
import {
  orderFacade,
  type OrderFacade,
} from "@/services/order.service";
import {
  getCustomerSnapshot,
  getServerCustomerSnapshot,
  subscribeToCustomerState,
} from "@/services/customer-state.service";

export interface CustomerDataController {
  loadCart(): CartItem[];
  saveCart(items: CartItem[]): void;
  loadOrders(): CustomerOrder[];
  createOrder(input: CreateOrderInput, cart: CartItem[]): CustomerOrder;
  advanceOrderStatus(orderId: string): CustomerOrder | null;
  acceptOrder(orderId: string, acceptedBy: string): CustomerOrder | null;
  verifyOrder(orderId: string, code: string): CustomerOrder | null;
  markArrived(orderId: string): CustomerOrder | null;
  rateOrder(orderId: string, rating: "yes" | "no"): CustomerOrder | null;
  rateCustomer(
    orderId: string,
    rating: "good" | "regular" | "bad",
  ): CustomerOrder | null;
  subscribeToStatusChanges(observer: OrderStatusObserver): () => void;
}

export class OrderController implements CustomerDataController {
  constructor(private readonly service: OrderFacade) {}

  getCustomerState = getCustomerSnapshot;
  getServerCustomerState = getServerCustomerSnapshot;
  subscribeToCustomerState = subscribeToCustomerState;

  loadCart(): CartItem[] {
    return this.service.loadCart();
  }

  saveCart(items: CartItem[]): void {
    this.service.saveCart(items);
  }

  loadOrders(): CustomerOrder[] {
    return this.service.loadOrders();
  }

  createOrder(input: CreateOrderInput, cart: CartItem[]): CustomerOrder {
    return this.service.createOrder(input, cart);
  }

  advanceOrderStatus(orderId: string): CustomerOrder | null {
    return this.service.advanceOrderStatus(orderId);
  }

  acceptOrder(orderId: string, acceptedBy: string): CustomerOrder | null {
    return this.service.acceptOrder(orderId, acceptedBy);
  }

  verifyOrder(orderId: string, code: string): CustomerOrder | null {
    return this.service.verifyOrder(orderId, code);
  }

  markArrived(orderId: string): CustomerOrder | null {
    return this.service.markArrived(orderId);
  }

  rateOrder(orderId: string, rating: "yes" | "no"): CustomerOrder | null {
    return this.service.rateOrder(orderId, rating);
  }

  rateCustomer(
    orderId: string,
    rating: "good" | "regular" | "bad",
  ): CustomerOrder | null {
    return this.service.rateCustomer(orderId, rating);
  }

  subscribeToStatusChanges(observer: OrderStatusObserver): () => void {
    return this.service.subscribeToStatusChanges(observer);
  }
}

export const orderController = new OrderController(orderFacade);
