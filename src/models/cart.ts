import type { Product } from "@/models/product";

export interface CartItem {
  product: Product;
  quantity: number;
}