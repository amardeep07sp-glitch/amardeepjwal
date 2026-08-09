import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

const EXPORT_COLUMNS = ['orderNumber', 'customer', 'orderStatus', 'paymentStatus', 'grandTotal', 'currency', 'source', 'createdAt'];

const toRow = (order) => ({
  orderNumber: order.orderNumber,
  customer: order.customer?.name ?? '',
  orderStatus: order.orderStatus,
  paymentStatus: order.paymentStatus,
  grandTotal: order.grandTotal,
  currency: order.currency,
  source: order.source,
  createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
});

export const buildOrdersCsv = (orders) => stringify(orders.map(toRow), { header: true, columns: EXPORT_COLUMNS });

export const buildOrdersExcel = async (orders) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = EXPORT_COLUMNS.map((key) => ({ header: key, key, width: 20 }));
  orders.forEach((order) => sheet.addRow(toRow(order)));
  return workbook.xlsx.writeBuffer();
};
