import { z } from 'zod';

export const STOCK_STATUSES = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'pre_order', label: 'Pre-order' },
  { value: 'discontinued', label: 'Discontinued' },
];

export const STOCK_STATUS_BADGE_VARIANTS = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
  pre_order: 'info',
  discontinued: 'secondary',
};

export const MOVEMENT_TYPE_LABELS = {
  opening_stock: 'Opening Stock',
  purchase: 'Purchase',
  sale: 'Sale',
  return: 'Return',
  damage: 'Damage',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  manual_adjustment: 'Manual Adjustment',
  stock_audit: 'Stock Audit',
  reservation: 'Reservation',
  reservation_release: 'Reservation Release',
};

export const inventorySettingsSchema = z.object({
  minimumStock: z.coerce.number().min(0).default(0),
  maximumStock: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
  stockStatus: z.enum(STOCK_STATUSES.map((s) => s.value)).optional(),
});

export const inventorySettingsDefaults = {
  minimumStock: 0,
  maximumStock: 0,
  reorderLevel: 0,
  active: true,
};
