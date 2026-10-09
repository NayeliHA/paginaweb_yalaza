import type { Category, Product } from "@/models";
import {
  getCategories,
  getFeaturedProducts,
  getProducts,
} from "@/repositories/catalog.repository";

export interface HomeCatalog {
  categories: Category[];
  featuredProducts: Product[];
}

export interface MenuCatalog {
  categories: Category[];
  products: Product[];
}

export function getHomeCatalog(): HomeCatalog {
  return {
    categories: getCategories(),
    featuredProducts: getFeaturedProducts(),
  };
}

export function getMenuCatalog(): MenuCatalog {
  return {
    categories: getCategories(),
    products: getProducts(),
  };
}
