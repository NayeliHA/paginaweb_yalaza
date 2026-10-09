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
}