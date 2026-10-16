import type { PaymentMethod } from "@/models";
import { businessConfig } from "@/lib/business-config";

export interface PaymentPreparation {
  message: string;
  qrImageUrl?: string;
  instructions?: string[];
}

export interface PaymentProcessor {
  method: PaymentMethod;
  label: string;
  prepare(amount: number): PaymentPreparation;
}

class CashPaymentProcessor implements PaymentProcessor {
  method = "cash" as const;
  label = "Efectivo";

  prepare(amount: number): PaymentPreparation {
    return {
      message: `Pago en efectivo por S/ ${amount.toFixed(2)}`,
      instructions: ["Ten el monto listo al momento de recibir o recoger tu pedido."],
    };
  }
}

class YapeQrProvider {
  createQrCode(params: { amount: number; phone: string; owner: string }): string {
    const yapePayload = [
      "YAPE",
      `titular=${params.owner}`,
      `celular=${params.phone}`,
      `monto=${params.amount.toFixed(2)}`,
    ].join("|");

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(yapePayload)}`;
  }
}

class YapePaymentAdapter implements PaymentProcessor {
  method = "yape" as const;
  label = "Yape";

  constructor(private readonly qrProvider: YapeQrProvider) {}

  prepare(amount: number): PaymentPreparation {
    const qrImageUrl = this.qrProvider.createQrCode({
      amount,
      phone: businessConfig.yapePhone,
      owner: businessConfig.yapeOwner,
    });

    return {
      message: `Yapea S/ ${amount.toFixed(2)} a ${businessConfig.yapeOwner}`,
      qrImageUrl,
      instructions: [
        `Escanea el QR o yapea al ${businessConfig.yapePhone}.`,
        "Luego confirma el pedido y envía la captura por WhatsApp si el local la solicita.",
      ],
    };
  }
}

class CardGateway {
  createPaymentIntent(total: number): { description: string } {
    return { description: `Tarjeta reservada por S/ ${total.toFixed(2)}` };
  }
}

class CardPaymentAdapter implements PaymentProcessor {
  method = "card" as const;
  label = "Tarjeta";

  constructor(private readonly gateway: CardGateway) {}

  prepare(amount: number): PaymentPreparation {
    const intent = this.gateway.createPaymentIntent(amount);

    return {
      message: intent.description,
      instructions: ["El POS o enlace de tarjeta se coordina al confirmar el pedido."],
    };
  }
}

export function createPaymentProcessor(method: PaymentMethod): PaymentProcessor {
  if (method === "yape") return new YapePaymentAdapter(new YapeQrProvider());
  if (method === "card") return new CardPaymentAdapter(new CardGateway());
  return new CashPaymentProcessor();
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  yape: "Yape",
  card: "Tarjeta",
};
