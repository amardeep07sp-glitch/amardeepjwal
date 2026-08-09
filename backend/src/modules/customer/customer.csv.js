import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

const EXPORT_COLUMNS = [
  'customerCode',
  'firstName',
  'lastName',
  'email',
  'phone',
  'status',
  'customerType',
  'gstNumber',
  'companyName',
  'createdAt',
];

const toRow = (customer) => ({
  customerCode: customer.customerCode,
  firstName: customer.firstName,
  lastName: customer.lastName,
  email: customer.email ?? '',
  phone: customer.phone ?? '',
  status: customer.status,
  customerType: customer.customerType,
  gstNumber: customer.gstNumber,
  companyName: customer.companyName,
  createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : '',
});

export const buildCustomersCsv = (customers) => stringify(customers.map(toRow), { header: true, columns: EXPORT_COLUMNS });

export const buildCustomersExcel = async (customers) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Customers');
  sheet.columns = EXPORT_COLUMNS.map((key) => ({ header: key, key, width: 20 }));
  customers.forEach((customer) => sheet.addRow(toRow(customer)));
  return workbook.xlsx.writeBuffer();
};

// Bulk-create only (no update-by-code matching in v1, unlike Inventory's
// settings-only import) - each row becomes a new lead/customer. Never
// throws on a bad row - collects per-row errors so one typo doesn't abort
// an otherwise-good batch.
export const parseCustomersCsv = (buffer) => {
  const records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });

  return records.map((row) => ({
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || undefined,
    phone: row.phone || undefined,
    customerType: row.customerType || undefined,
    gstNumber: row.gstNumber || '',
    companyName: row.companyName || '',
  }));
};
