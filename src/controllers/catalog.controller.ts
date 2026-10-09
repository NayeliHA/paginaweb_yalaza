import {
  getHomeCatalog,
  getMenuCatalog,
  type HomeCatalog,
  type MenuCatalog,
} from "@/services/catalog.service";

export function getHomeContent(): HomeCatalog {
  return getHomeCatalog();
}

export function getMenuContent(): MenuCatalog {
  return getMenuCatalog();
}
