import type {
  CustomerDetails,
  CustomerOrder,
  DeliveryDetails,
  FulfillmentType,
  OrderItem,
  PaymentMethod,
  PickupDetails,
} from "@/models";

type FulfillmentDetails = DeliveryDetails | PickupDetails;

export class OrderBuilder {
  private cliente?: CustomerDetails;
  private tipoEntrega?: FulfillmentType;
  private datosEntrega?: FulfillmentDetails;
  private productos?: OrderItem[];
  private subtotal = 0;
  private costoEntrega = 0;
  private codigoSeguridad?: string;
  private metodoPago?: PaymentMethod;
  private etiquetaPago?: string;

  constructor(private readonly id: string) {}

  agregarCliente(cliente: CustomerDetails): this {
    this.cliente = cliente;
    return this;
  }

  agregarEntrega(
    tipoEntrega: FulfillmentType,
    datosEntrega: FulfillmentDetails,
  ): this {
    this.tipoEntrega = tipoEntrega;
    this.datosEntrega = datosEntrega;
    return this;
  }

  agregarProductos(productos: OrderItem[]): this {
    this.productos = productos;
    this.subtotal = productos.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    return this;
  }

  agregarCostoEntrega(costoEntrega: number): this {
    this.costoEntrega = costoEntrega;
    return this;
  }

  agregarCodigoSeguridad(codigo: string): this {
    this.codigoSeguridad = codigo;
    return this;
  }

  agregarPago(metodoPago: PaymentMethod, etiquetaPago: string): this {
    this.metodoPago = metodoPago;
    this.etiquetaPago = etiquetaPago;
    return this;
  }

  build(): CustomerOrder {
    if (
      !this.cliente ||
      !this.tipoEntrega ||
      !this.datosEntrega ||
      !this.productos?.length ||
      !this.codigoSeguridad ||
      !this.metodoPago ||
      !this.etiquetaPago
    ) {
      throw new Error("El pedido no está completo.");
    }

    const common = {
      id: this.id,
      securityCode: this.codigoSeguridad,
      customer: this.cliente,
      items: this.productos,
      subtotal: this.subtotal,
      deliveryFee: this.costoEntrega,
      total: this.subtotal + this.costoEntrega,
      paymentMethod: this.metodoPago,
      paymentLabel: this.etiquetaPago,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    if (this.tipoEntrega === "delivery" && "address" in this.datosEntrega) {
      return {
        ...common,
        fulfillmentType: "delivery",
        fulfillment: this.datosEntrega,
      };
    }
    if (this.tipoEntrega === "pickup" && "location" in this.datosEntrega) {
      return {
        ...common,
        fulfillmentType: "pickup",
        fulfillment: this.datosEntrega,
      };
    }
    throw new Error("La modalidad no coincide con sus datos de entrega.");
  }
}
