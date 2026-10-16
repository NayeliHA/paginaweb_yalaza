import type { CustomerOrder, Product, RegisteredUser } from "@/models";

export function createDemoOrders(customers: RegisteredUser[], products: Product[]): CustomerOrder[] {
  return customers.filter(customer => customer.role === "customer" && customer.id.startsWith("demo-customer-"))
    .slice(0, 5).map((customer, index) => {
      const product = products[index % products.length];
      const quantity = index % 2 + 1;
      const common = {
        id: `YZ-DEMO-${String(index + 1).padStart(3, "0")}`,
        active: true,
        securityCode: String(1001 + index),
        customer: { id: customer.id, name: customer.name, lastName: customer.lastName, email: customer.email, phone: customer.phone },
        items: [{ productId: product.id, name: product.name, unitPrice: product.price, quantity }],
        subtotal: product.price * quantity, deliveryFee: 0, total: product.price * quantity,
        paymentMethod: "cash" as const, paymentLabel: "Efectivo", status: "pending" as const,
        createdAt: new Date(Date.now() - index * 60000).toISOString(),
      };
      return index % 2 === 0
        ? { ...common, fulfillmentType: "pickup" as const, fulfillment: { location: "Local Yalaza" } }
        : { ...common, fulfillmentType: "delivery" as const, fulfillment: { district: "Lima", address: `Calle de ejemplo ${100 + index}`, reference: "Pedido de demostración" } };
    });
}
