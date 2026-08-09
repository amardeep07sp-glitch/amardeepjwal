export function formatCurrency(value, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value ?? 0);
  } catch {
    return `${currency} ${(value ?? 0).toFixed(2)}`;
  }
}
