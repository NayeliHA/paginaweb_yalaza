const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}
