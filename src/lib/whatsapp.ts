import type { CustomerOrder } from "@/models";
import { businessConfig } from "@/lib/business-config";
import { formatPrice } from "@/lib/format";

function getDeliverySummary(order: Extract<CustomerOrder, { fulfillmentType: "delivery" }>): string {
  const details = order.fulfillment;
  const address = details.address || "Ubicación GPS";
  const mapLink =
    details.latitude !== undefined && details.longitude !== undefined
      ? `, mapa: https://maps.google.com/?q=${details.latitude},${details.longitude}`
      : "";
  return `${address}${details.reference ? `, referencia: ${details.reference}` : ""}${mapLink}`;
}

export function buildWhatsAppOrderUrl(order: CustomerOrder): string | null {
  const phone = businessConfig.whatsappNumber.replace(/\D/g, "");
  if (!phone) return null;

  const fulfillmentSummary =
    order.fulfillmentType === "delivery"
      ? getDeliverySummary(order)
      : `Recojo en local: ${order.fulfillment.location}`;
  const lines = order.items.map(
    (item) => `- ${item.quantity} x ${item.name}: ${formatPrice(item.unitPrice * item.quantity)}`,
  );
  const message = [
    `Hola, quiero confirmar el pedido ${order.id}.`,
    `Cliente: ${order.customer.name} · ${order.customer.phone}`,
    `Modalidad: ${fulfillmentSummary}`,
    ...lines,
    `Total mostrado: ${formatPrice(order.total)}`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}