// Precise (never "65K") - a shopper comparing two rings needs the exact
// price, unlike an admin dashboard stat card where compact notation is
// the whole point. Keep this distinct from the admin panel's
// formatCompact/formatCurrency helpers on purpose.
export const formatPrice = (value) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value ?? 0)}`;
