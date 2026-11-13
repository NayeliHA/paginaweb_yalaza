export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  featured: boolean;
  available: boolean;
  image?: string;
  spiceLevel?: 1 | 2 | 3;
  ingredients?: { name: string; quantity: number; unit: string }[];
}
