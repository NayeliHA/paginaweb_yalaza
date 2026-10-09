export type FulfillmentType = "delivery" | "pickup";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "on_the_way"
  | "ready_for_pickup"
  | "delivered"
  | "picked_up";

export type PaymentMethod = "cash" | "yape" | "card";

export interface CustomerDetails {
  id?: string;
  name: string;
  lastName?: string;
  email?: string;
  phone: string;
}

export interface DeliveryDetails {
  district: string;
  address: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
}

export interface PickupDetails {
  location: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CustomerOrderCommon {
  id: string;
  securityCode: string;
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  status: OrderStatus;
  acceptedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type CustomerOrder = CustomerOrderCommon &
  (
    | { fulfillmentType: "delivery"; fulfillment: DeliveryDetails }
    | { fulfillmentType: "pickup"; fulfillment: PickupDetails }
  );

export interface CreateOrderInput {
  customer: CustomerDetails;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  delivery?: DeliveryDetails;
}
