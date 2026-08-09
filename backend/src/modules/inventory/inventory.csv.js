import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

// Export columns are display-oriented (product/warehouse names, not raw
// ObjectIds) since this file is meant to be opened in a spreadsheet by a
// human, not round-tripped byte-for-byte.
const EXPORT_COLUMNS = [
  'sku',
  'product',
  'variant',
  'warehouse',
  'availableQuantity',
  'reservedQuantity',
  'damagedQuantity',
  'returnedQuantity',
  'incomingQuantity',
  'minimumStock',
  'maximumStock',
  'reorderLevel',
  'stockStatus',
  'active',
];

export const buildInventoryCsv = (inventoryRecords) => {
  const rows = inventoryRecords.map((record) => ({
    sku: record.sku,
    product: record.product?.name ?? '',
    variant: record.variant?.sku ?? '',
    warehouse: record.warehouse?.name ?? '',
    availableQuantity: record.availableQuantity,
    reservedQuantity: record.reservedQuantity,
    damagedQuantity: record.damagedQuantity,
    returnedQuantity: record.returnedQuantity,
    incomingQuantity: record.incomingQuantity,
    minimumStock: record.minimumStock,
    maximumStock: record.maximumStock,
    reorderLevel: record.reorderLevel,
    stockStatus: record.stockStatus,
    active: record.active,
  }));

  return stringify(rows, { header: true, columns: EXPORT_COLUMNS });
};

// Import is deliberately restricted to threshold/settings fields
// (minimumStock/maximumStock/reorderLevel) - never quantities. Quantities
// may only ever change through inventoryLedgerService.recordMovement(), and
// a bulk CSV import has no per-row "reason" or ledger semantics, so it must
// never be allowed to touch availableQuantity et al.
export const parseInventorySettingsCsv = (buffer) => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => ({
    sku: row.sku,
    minimumStock: row.minimumStock !== undefined && row.minimumStock !== '' ? Number(row.minimumStock) : undefined,
    maximumStock: row.maximumStock !== undefined && row.maximumStock !== '' ? Number(row.maximumStock) : undefined,
    reorderLevel: row.reorderLevel !== undefined && row.reorderLevel !== '' ? Number(row.reorderLevel) : undefined,
  }));
};
