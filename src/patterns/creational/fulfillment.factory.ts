import type {
  DeliveryDetails,
  FulfillmentType,
  PickupDetails,
} from "@/models";
import { businessConfig } from "@/lib/business-config";

export interface Entrega {
  readonly tipo: FulfillmentType;
  readonly costoEntrega: number;
  crearDetalles(datosDelivery?: DeliveryDetails): DeliveryDetails | PickupDetails;
}

class EntregaDelivery implements Entrega {
  readonly tipo = "delivery" as const;
  readonly costoEntrega = 0;

  crearDetalles(datosDelivery?: DeliveryDetails): DeliveryDetails {
    if (!datosDelivery) throw new Error("Faltan los datos de delivery.");
    return datosDelivery;
  }
}

class EntregaRecojo implements Entrega {
  readonly tipo = "pickup" as const;
  readonly costoEntrega = 0;
  readonly location = businessConfig.pickupAddress;

  crearDetalles(): PickupDetails {
    return { location: this.location };
  }
}

export class EntregaFactory {
  static createEntrega(tipo: FulfillmentType): Entrega {
    return tipo === "delivery" ? new EntregaDelivery() : new EntregaRecojo();
  }
}