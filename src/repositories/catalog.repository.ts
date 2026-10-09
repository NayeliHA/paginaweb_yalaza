import type { Category, Product } from "@/models";

const categories: Category[] = [
  {
    id: "cat-alitas",
    name: "Alitas",
    description: "Alitas crujientes con nuestras salsas favoritas.",
    slug: "alitas",
  },
  {
    id: "cat-combos",
    name: "Combos",
    description: "Combos para disfrutar solo o compartir.",
    slug: "combos",
  },
  {
    id: "cat-acompanamientos",
    name: "Acompañamientos",
    description: "El complemento perfecto para tu pedido.",
    slug: "acompanamientos",
  },
  {
    id: "cat-bebidas",
    name: "Bebidas",
    description: "Bebidas para acompañar tu comida.",
    slug: "bebidas",
  },
];

const products: Product[] = [
  {
    id: "prod-alitas-bbq",
    name: "Alitas BBQ",
    description: "Alitas bañadas en salsa BBQ.",
    price: 22.9,
    categoryId: "cat-alitas",
    featured: true,
    available: true,
  },
  {
    id: "prod-alitas-buffalo",
    name: "Alitas Buffalo",
    description: "Alitas con salsa Buffalo y un toque picante.",
    price: 22.9,
    categoryId: "cat-alitas",
    featured: true,
    available: true,
    spiceLevel: 2,
  },
  {
    id: "prod-combo-yalaza",
    name: "Combo Yalaza",
    description: "Alitas, acompañamiento y bebida.",
    price: 29.9,
    categoryId: "cat-combos",
    featured: true,
    available: true,
  },
];

export function getCategories(): Category[] {
  return categories;
}

export function getProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured && product.available);
}