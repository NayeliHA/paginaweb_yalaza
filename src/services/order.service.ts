import type {
  CartItem,
  CreateOrderInput,
  CustomerOrder,
  OrderStatus,
} from "@/models";
import { getProducts } from "@/repositories/catalog.repository";
import {
  customerRepository,
  type CustomerRepository,
} from "@/repositories/customer.repository";
import {
  getCustomerSnapshot,
  saveCustomerCart,
  saveCustomerOrders,
} from "@/services/customer-state.service";
import { OrderBuilder } from "@/patterns/creational/order.builder";
import { EntregaFactory } from "@/patterns/creational/fulfillment.factory";
import {
  getNextOrderStatus,
  orderStatusLabels,
} from "@/patterns/behavioral/order-state";
import {
  OrderStatusPublisher,
  type OrderStatusObserver,
} from "@/patterns/behavioral/order-status-observer";
import { createPaymentProcessor } from "@/patterns/structural/payment-adapter";

const statusPublisher = new OrderStatusPublisher();

function createOrderId(): string {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YZ-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

function createSecurityCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export class OrderFacade {
  constructor(private readonly repository: CustomerRepository) {}

  loadCart(): CartItem[] {
    return getCustomerSnapshot().hydrated
      ? getCustomerSnapshot().cart
      : this.repository.loadCart();
  }

  saveCart(items: CartItem[]): void {
    saveCustomerCart(items);
  }

  loadOrders(): CustomerOrder[] {
    return getCustomerSnapshot().hydrated
      ? getCustomerSnapshot().orders
      : this.repository.loadOrders();
  }

  createOrder(input: CreateOrderInput, cart: CartItem[]): CustomerOrder {
    const name = input.customer.name.trim();
    const lastName = input.customer.lastName?.trim();
    const email = input.customer.email?.trim();
    const phone = input.customer.phone.replace(/\D/g, "");

    if (name.length < 2) {
      throw new Error("Ingresa el nombre del cliente.");
    }
    if (!/^9\d{8}$/.test(phone)) {
      throw new Error("Ingresa un celular válido de 9 dígitos.");
    }
    if (cart.length === 0) {
      throw new Error("Agrega productos antes de confirmar el pedido.");
    }

    const delivery = input.delivery;
    if (
      input.fulfillmentType === "delivery" &&
      (!delivery ||
        typeof delivery.district !== "string" ||
        !delivery.district.trim() ||
        typeof delivery.address !== "string" ||
        !delivery.address.trim())
    ) {
      throw new Error("Completa el distrito y la dirección de entrega.");
    }

    const catalog = getProducts();
    const items = cart.map(({ product, quantity }) => {
      const current = catalog.find((item) => item.id === product.id);
      if (!current?.available) {
        throw new Error(`${product.name} ya no está disponible.`);
      }
      return {
        productId: current.id,
        name: current.name,
        unitPrice: current.price,
        quantity,
      };
    });

    const entrega = EntregaFactory.createEntrega(input.fulfillmentType);
    const datosEntrega = entrega.crearDetalles(delivery);
    const paymentProcessor = createPaymentProcessor(input.paymentMethod);
    const order = new OrderBuilder(createOrderId())
      .agregarCliente({
        id: input.customer.id,
        name,
        lastName,
        email,
        phone,
      })
      .agregarEntrega(entrega.tipo, datosEntrega)
      .agregarProductos(items)
      .agregarCostoEntrega(entrega.costoEntrega)
      .agregarCodigoSeguridad(createSecurityCode())
      .agregarPago(input.paymentMethod, paymentProcessor.label)
      .build();

    order.subtotal = roundCurrency(order.subtotal);
    order.deliveryFee = roundCurrency(order.deliveryFee);
    order.total = roundCurrency(order.subtotal + order.deliveryFee);
    paymentProcessor.prepare(order.total);
    saveCustomerOrders([order, ...this.loadOrders()]);
    return order;
  }

  advanceOrderStatus(orderId: string): CustomerOrder | null {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    const order = orders[orderIndex];
    if (!order) return null;

    const status = getNextOrderStatus(order.status, order.fulfillmentType);
    if (!status) return null;

    const updated: CustomerOrder = { ...order, status };
    orders[orderIndex] = updated;
    saveCustomerOrders(orders);
    statusPublisher.notify(updated);
    return updated;
  }

  acceptOrder(orderId: string, acceptedBy: string): CustomerOrder | null {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    const order = orders[orderIndex];
    if (!order || order.status !== "pending") return null;

    const updated: CustomerOrder = {
      ...order,
      status: "accepted",
      acceptedBy,
    };
    orders[orderIndex] = updated;
    saveCustomerOrders(orders);
    statusPublisher.notify(updated);
    return updated;
  }

  verifyOrder(orderId: string, code: string): CustomerOrder | null {
    const orders = this.loadOrders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    const order = orders[orderIndex];
    if (!order || order.securityCode !== code.trim()) return null;

    const updated: CustomerOrder = {
      ...order,
      status: order.fulfillmentType === "delivery" ? "delivered" : "picked_up",
      verifiedAt: new Date().toISOString(),
    };
    orders[orderIndex] = updated;
    saveCustomerOrders(orders);
    statusPublisher.notify(updated);
    return updated;
  }

  subscribeToStatusChanges(observer: OrderStatusObserver): () => void {
    return statusPublisher.subscribe(observer);
  }
}

export const orderFacade = new OrderFacade(customerRepository);

export function getOrderStatusLabel(status: OrderStatus): string {
  return orderStatusLabels[status];
}
