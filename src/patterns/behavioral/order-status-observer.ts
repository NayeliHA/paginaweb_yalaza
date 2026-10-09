import type { CustomerOrder } from "@/models";

export interface OrderStatusObserver {
  onStatusChanged(order: CustomerOrder): void;
}

export class OrderStatusPublisher {
  private readonly observers = new Set<OrderStatusObserver>();

  subscribe(observer: OrderStatusObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  notify(order: CustomerOrder): void {
    this.observers.forEach((observer) => observer.onStatusChanged(order));
  }
}