const formatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}
