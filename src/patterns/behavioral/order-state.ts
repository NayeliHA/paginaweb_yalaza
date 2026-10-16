import type { FulfillmentType, OrderStatus } from "@/models";

const deliveryTransitions: Record<OrderStatus, OrderStatus | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "prepared",
  prepared: "on_the_way",
  on_the_way: "delivered",
  ready_for_pickup: null,
  delivered: null,
  picked_up: null,
};

const pickupTransitions: Record<OrderStatus, OrderStatus | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready_for_pickup",
  prepared: null,
  on_the_way: null,
  ready_for_pickup: "picked_up",
  delivered: null,
  picked_up: null,
};

export function getNextOrderStatus(
  status: OrderStatus,
  fulfillmentType: FulfillmentType,
): OrderStatus | null {
  return fulfillmentType === "delivery"
    ? deliveryTransitions[status]
    : pickupTransitions[status];
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  preparing: "En preparación",
  prepared: "Preparado",
  on_the_way: "En camino",
  ready_for_pickup: "Listo para recojo",
  delivered: "Entregado",
  picked_up: "Recojo completado",
};

export function getOrderActionLabel(status: OrderStatus, fulfillmentType: FulfillmentType): string | null {
  if (status === "accepted") return "Iniciar preparación";
  if (status === "preparing") return fulfillmentType === "delivery" ? "Marcar preparado" : "Listo para recojo";
  if (status === "prepared") return "Salir a reparto";
  return null;
}
