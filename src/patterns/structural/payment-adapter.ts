import type { PaymentMethod } from "@/models";

export interface PaymentProcessor {
  method: PaymentMethod;
  label: string;
  prepare(amount: number): string;
}

class CashPaymentProcessor implements PaymentProcessor {
  method = "cash" as const;
  label = "Efectivo";

  prepare(amount: number): string {
    return `Pago en efectivo por S/ ${amount.toFixed(2)}`;
  }
}

class YapePaymentProcessor implements PaymentProcessor {
  method = "yape" as const;
  label = "Yape";

  prepare(amount: number): string {
    return `Pago por Yape por S/ ${amount.toFixed(2)}`;
  }
}

class CardGateway {
  createPaymentIntent(total: number): string {
    return `Tarjeta reservada por S/ ${total.toFixed(2)}`;
  }
}

class CardPaymentAdapter implements PaymentProcessor {
  method = "card" as const;
  label = "Tarjeta";

  constructor(private readonly gateway: CardGateway) {}

  prepare(amount: number): string {
    return this.gateway.createPaymentIntent(amount);
  }
}

export function createPaymentProcessor(method: PaymentMethod): PaymentProcessor {
  if (method === "yape") return new YapePaymentProcessor();
  if (method === "card") return new CardPaymentAdapter(new CardGateway());
  return new CashPaymentProcessor();
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  yape: "Yape",
  card: "Tarjeta",
};
