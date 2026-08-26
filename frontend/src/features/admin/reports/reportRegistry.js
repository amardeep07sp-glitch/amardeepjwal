// Every named report from the Phase 11 spec, in one place - the Reports
// Center reads this registry to render a report picker + the right table
// shape + export buttons, instead of a bespoke page per report. `shape`
// tells ReportResultView how to render the response:
//   'object'    -> a stat-card grid (summary reports)
//   'array'     -> a plain table, no pagination
//   'paginated' -> a table backed by {items, meta|total}
// `columns` is omitted where the shape varies enough that auto-generating
// columns from the first row's keys reads better than a fixed list.

export const SALES_REPORTS = [
  { key: 'sales-summary', label: 'Sales Summary', endpoint: '/reports/sales/summary', shape: 'object', dateRange: true },
  {
    key: 'sales-by-product',
    label: 'Sales by Product',
    endpoint: '/reports/sales/by-product',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'name', header: 'Product' }, { key: 'quantity', header: 'Qty' }, { key: 'revenue', header: 'Revenue' }],
  },
  {
    key: 'sales-by-category',
    label: 'Sales by Category',
    endpoint: '/reports/sales/by-category',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'name', header: 'Category' }, { key: 'quantity', header: 'Qty' }, { key: 'revenue', header: 'Revenue' }],
  },
  {
    key: 'sales-by-brand',
    label: 'Sales by Brand',
    endpoint: '/reports/sales/by-brand',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'name', header: 'Brand' }, { key: 'quantity', header: 'Qty' }, { key: 'revenue', header: 'Revenue' }],
  },
  {
    key: 'sales-by-customer',
    label: 'Sales by Customer',
    endpoint: '/reports/sales/by-customer',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'name', header: 'Customer' }, { key: 'customerCode', header: 'Code' }, { key: 'orderCount', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }],
  },
  {
    key: 'sales-by-salesperson',
    label: 'Sales by Salesperson',
    endpoint: '/reports/sales/by-salesperson',
    shape: 'array',
    dateRange: true,
    columns: [{ key: 'name', header: 'Staff' }, { key: 'orderCount', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }],
  },
  {
    key: 'sales-by-date',
    label: 'Sales Trend',
    endpoint: '/reports/sales/by-date',
    shape: 'array',
    dateRange: true,
    // Day/Week/Month bucketing (backend: salesReports.service.js#getSalesByDate)
    // - the only report in the registry with a groupBy selector, so
    // DomainReportsTab only renders the control when this is present.
    groupByOptions: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
    columns: [{ key: '_id', header: 'Period' }, { key: 'orderCount', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }],
  },
  { key: 'cancelled-orders', label: 'Cancelled Orders', endpoint: '/reports/sales/cancelled-orders', shape: 'paginated' },
  { key: 'refunds', label: 'Refunds', endpoint: '/reports/sales/refunds', shape: 'paginated' },
];

export const PURCHASE_REPORTS = [
  { key: 'purchase-summary', label: 'Purchase Summary', endpoint: '/reports/purchase/summary', shape: 'object', dateRange: true },
  {
    key: 'supplier-wise',
    label: 'Supplier-wise Purchase',
    endpoint: '/reports/purchase/supplier-wise',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'name', header: 'Supplier' }, { key: 'supplierCode', header: 'Code' }, { key: 'orderCount', header: 'Orders' }, { key: 'totalValue', header: 'Total Value' }],
  },
  { key: 'outstanding-purchase', label: 'Outstanding Purchase', endpoint: '/reports/purchase/outstanding', shape: 'array', columns: [{ key: 'supplierName', header: 'Supplier' }, { key: 'balance', header: 'Balance' }] },
  { key: 'grn-report', label: 'GRN Report', endpoint: '/reports/purchase/grn', shape: 'paginated', dateRange: true, columns: [{ key: 'grnNumber', header: 'GRN #' }, { key: 'createdAt', header: 'Date' }] },
  { key: 'purchase-returns', label: 'Purchase Return Report', endpoint: '/reports/purchase/returns', shape: 'paginated', dateRange: true, columns: [{ key: 'returnNumber', header: 'Return #' }, { key: 'amount', header: 'Amount' }, { key: 'status', header: 'Status' }] },
];

export const INVENTORY_REPORTS = [
  { key: 'current-stock', label: 'Current Stock', endpoint: '/reports/inventory/current-stock', shape: 'paginated', columns: [{ key: 'sku', header: 'SKU' }, { key: 'availableQuantity', header: 'Available' }, { key: 'stockStatus', header: 'Status' }] },
  { key: 'low-stock', label: 'Low Stock', endpoint: '/reports/inventory/low-stock', shape: 'paginated', columns: [{ key: 'sku', header: 'SKU' }, { key: 'availableQuantity', header: 'Available' }, { key: 'minimumStock', header: 'Min' }] },
  { key: 'out-of-stock', label: 'Out of Stock', endpoint: '/reports/inventory/out-of-stock', shape: 'paginated', columns: [{ key: 'sku', header: 'SKU' }, { key: 'availableQuantity', header: 'Available' }] },
  {
    key: 'inventory-valuation',
    label: 'Inventory Valuation',
    endpoint: '/reports/inventory/valuation',
    shape: 'paginated',
    exportable: true,
    columns: [{ key: 'sku', header: 'SKU' }, { key: 'name', header: 'Product' }, { key: 'availableQuantity', header: 'Qty' }, { key: 'costPrice', header: 'Cost Price' }, { key: 'value', header: 'Value' }],
  },
  { key: 'stock-movement', label: 'Stock Movement', endpoint: '/reports/inventory/movement', shape: 'paginated', dateRange: true, columns: [{ key: 'movementType', header: 'Type' }, { key: 'quantityChanged', header: 'Qty Changed' }, { key: 'createdAt', header: 'Date' }] },
  { key: 'inventory-aging', label: 'Inventory Aging', endpoint: '/reports/inventory/aging', shape: 'paginated', columns: [{ key: 'sku', header: 'SKU' }, { key: 'name', header: 'Product' }, { key: 'availableQuantity', header: 'Qty' }, { key: 'ageDays', header: 'Age (days)' }] },
  { key: 'fast-moving', label: 'Fast Moving', endpoint: '/reports/inventory/fast-moving', shape: 'array', columns: [{ key: 'name', header: 'Product' }, { key: 'sku', header: 'SKU' }, { key: 'unitsSold', header: 'Units Sold' }] },
  { key: 'slow-moving', label: 'Slow Moving', endpoint: '/reports/inventory/slow-moving', shape: 'array', columns: [{ key: 'name', header: 'Product' }, { key: 'sku', header: 'SKU' }, { key: 'unitsSold', header: 'Units Sold' }] },
  { key: 'dead-stock', label: 'Dead Stock', endpoint: '/reports/inventory/dead-stock', shape: 'array', columns: [{ key: 'name', header: 'Product' }, { key: 'sku', header: 'SKU' }, { key: 'availableQuantity', header: 'Qty on Hand' }] },
];

export const CUSTOMER_REPORTS = [
  { key: 'customer-growth', label: 'Customer Growth', endpoint: '/reports/customers/growth', shape: 'array', columns: [{ key: 'date', header: 'Date' }, { key: 'count', header: 'New Customers' }] },
  {
    key: 'customer-ltv',
    label: 'Customer Lifetime Value',
    endpoint: '/reports/customers/lifetime-value',
    shape: 'paginated',
    exportable: true,
    columns: [{ key: 'name', header: 'Customer' }, { key: 'customerCode', header: 'Code' }, { key: 'orderCount', header: 'Orders' }, { key: 'lifetimeValue', header: 'Lifetime Value' }],
  },
  { key: 'repeat-customers', label: 'Repeat Customers', endpoint: '/reports/customers/repeat', shape: 'paginated', columns: [{ key: 'name', header: 'Customer' }, { key: 'customerCode', header: 'Code' }, { key: 'orderCount', header: 'Orders' }] },
  { key: 'new-customers', label: 'New Customers', endpoint: '/reports/customers/new', shape: 'paginated', dateRange: true, columns: [{ key: 'displayName', header: 'Customer' }, { key: 'customerCode', header: 'Code' }, { key: 'createdAt', header: 'Joined' }] },
  { key: 'wallet-summary', label: 'Wallet Summary', endpoint: '/reports/customers/wallet-summary', shape: 'object' },
  { key: 'loyalty-summary', label: 'Loyalty Summary', endpoint: '/reports/customers/loyalty-summary', shape: 'array', columns: [{ key: 'tier', header: 'Tier' }, { key: 'count', header: 'Customers' }, { key: 'totalPoints', header: 'Total Points' }] },
  { key: 'referral-summary', label: 'Referral Summary', endpoint: '/reports/customers/referral-summary', shape: 'array', columns: [{ key: 'status', header: 'Status' }, { key: 'count', header: 'Count' }, { key: 'totalRewardPoints', header: 'Reward Points' }] },
  { key: 'vip-customers', label: 'VIP Customers', endpoint: '/reports/customers/vip', shape: 'paginated', columns: [{ key: 'displayName', header: 'Customer' }, { key: 'customerCode', header: 'Code' }, { key: 'phone', header: 'Phone' }] },
];

export const SUPPLIER_REPORTS = [
  { key: 'supplier-performance', label: 'Supplier Performance', endpoint: '/reports/suppliers/performance', shape: 'array', columns: [{ key: 'name', header: 'Supplier' }, { key: 'orderCount', header: 'Orders' }, { key: 'totalValue', header: 'Total Value' }] },
  { key: 'outstanding-payables', label: 'Outstanding Payables', endpoint: '/reports/suppliers/outstanding-payables', shape: 'array', columns: [{ key: 'supplierName', header: 'Supplier' }, { key: 'balance', header: 'Balance' }] },
  {
    key: 'purchase-volume',
    label: 'Purchase Volume',
    endpoint: '/reports/suppliers/purchase-volume',
    shape: 'paginated',
    dateRange: true,
    columns: [{ key: 'name', header: 'Supplier' }, { key: 'totalQuantity', header: 'Units' }, { key: 'totalValue', header: 'Value' }],
  },
  { key: 'supplier-aging', label: 'Supplier Aging', endpoint: '/reports/suppliers/aging', shape: 'array', columns: [{ key: 'supplierName', header: 'Supplier' }, { key: 'total', header: 'Total Outstanding' }] },
  { key: 'supplier-returns', label: 'Purchase Returns', endpoint: '/reports/suppliers/returns', shape: 'paginated', columns: [{ key: 'name', header: 'Supplier' }, { key: 'returnCount', header: 'Returns' }, { key: 'totalAmount', header: 'Amount' }] },
];

export const TAX_REPORTS = [
  { key: 'gst-summary', label: 'GST Summary', endpoint: '/reports/tax/gst-summary', shape: 'array', dateRange: true, columns: [{ key: 'code', header: 'Code' }, { key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }, { key: 'net', header: 'Net' }] },
  { key: 'cgst', label: 'CGST', endpoint: '/reports/tax/cgst', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }] },
  { key: 'sgst', label: 'SGST', endpoint: '/reports/tax/sgst', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }] },
  { key: 'igst', label: 'IGST', endpoint: '/reports/tax/igst', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }] },
  { key: 'input-tax', label: 'Input Tax', endpoint: '/reports/tax/input-tax', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }] },
  { key: 'output-tax', label: 'Output Tax', endpoint: '/reports/tax/output-tax', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Account' }, { key: 'debit', header: 'Debit' }, { key: 'credit', header: 'Credit' }] },
  { key: 'tax-liability', label: 'Tax Liability', endpoint: '/reports/tax/liability', shape: 'liability', dateRange: true },
];

export const ACTIVITY_REPORTS = [
  { key: 'user-activity', label: 'User Activity', endpoint: '/reports/activity/user', shape: 'paginated', dateRange: true, columns: [{ key: 'module', header: 'Module' }, { key: 'action', header: 'Action' }, { key: 'entityName', header: 'Entity' }, { key: 'createdAt', header: 'When' }] },
  { key: 'customer-activity', label: 'Customer Activity', endpoint: '/reports/activity/customer', shape: 'paginated', dateRange: true, columns: [{ key: 'action', header: 'Action' }, { key: 'entityName', header: 'Entity' }, { key: 'createdAt', header: 'When' }] },
  { key: 'supplier-activity', label: 'Supplier Activity', endpoint: '/reports/activity/supplier', shape: 'paginated', dateRange: true, columns: [{ key: 'action', header: 'Action' }, { key: 'entityName', header: 'Entity' }, { key: 'createdAt', header: 'When' }] },
  { key: 'audit-logs', label: 'Audit Logs', endpoint: '/reports/activity/audit-logs', shape: 'paginated', dateRange: true, columns: [{ key: 'module', header: 'Module' }, { key: 'action', header: 'Action' }, { key: 'entityName', header: 'Entity' }, { key: 'createdAt', header: 'When' }] },
  { key: 'timeline', label: 'Timeline Report', endpoint: '/reports/activity/timeline', shape: 'array', dateRange: true, columns: [{ key: 'domain', header: 'Domain' }, { key: 'event', header: 'Event' }, { key: 'entity', header: 'Entity' }, { key: 'createdAt', header: 'When' }] },
];

export const SUPPORT_REPORTS = [
  { key: 'ticket-summary', label: 'Ticket Summary', endpoint: '/reports/support/tickets/summary', shape: 'object', dateRange: true },
  { key: 'tickets-by-category', label: 'Tickets by Category', endpoint: '/reports/support/tickets/by-category', shape: 'array', dateRange: true, columns: [{ key: 'category', header: 'Category' }, { key: 'count', header: 'Tickets' }] },
  { key: 'tickets-by-status', label: 'Tickets by Status', endpoint: '/reports/support/tickets/by-status', shape: 'array', dateRange: true, columns: [{ key: 'status', header: 'Status' }, { key: 'count', header: 'Tickets' }] },
  { key: 'tickets-by-agent', label: 'Tickets by Agent', endpoint: '/reports/support/tickets/by-agent', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Agent' }, { key: 'ticketCount', header: 'Assigned' }, { key: 'resolvedCount', header: 'Resolved' }] },
  {
    key: 'tickets-list',
    label: 'Ticket List',
    endpoint: '/reports/support/tickets/list',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'ticketNumber', header: 'Ticket #' }, { key: 'subject', header: 'Subject' }, { key: 'status', header: 'Status' }, { key: 'customerName', header: 'Customer' }, { key: 'agentName', header: 'Agent' }],
  },
  { key: 'issue-summary', label: 'Issue Report Summary', endpoint: '/reports/support/issues/summary', shape: 'object', dateRange: true },
  { key: 'issues-by-category', label: 'Issue Reports by Category', endpoint: '/reports/support/issues/by-category', shape: 'array', dateRange: true, columns: [{ key: 'category', header: 'Category' }, { key: 'count', header: 'Reports' }] },
  {
    key: 'issues-list',
    label: 'Issue Report List',
    endpoint: '/reports/support/issues/list',
    shape: 'paginated',
    dateRange: true,
    exportable: true,
    columns: [{ key: 'issueNumber', header: 'Issue #' }, { key: 'category', header: 'Category' }, { key: 'status', header: 'Status' }, { key: 'reporterName', header: 'Reporter' }],
  },
  { key: 'feedback-summary', label: 'Feedback Summary', endpoint: '/reports/support/feedback/summary', shape: 'array', columns: [{ key: 'category', header: 'Category' }, { key: 'count', header: 'Responses' }, { key: 'avgRating', header: 'Avg Rating' }] },
];

export const REPORT_DOMAINS = [
  { key: 'sales', label: 'Sales', reports: SALES_REPORTS },
  { key: 'purchase', label: 'Purchase', reports: PURCHASE_REPORTS },
  { key: 'inventory', label: 'Inventory', reports: INVENTORY_REPORTS },
  { key: 'customers', label: 'Customers', reports: CUSTOMER_REPORTS },
  { key: 'suppliers', label: 'Suppliers', reports: SUPPLIER_REPORTS },
  { key: 'tax', label: 'Tax', reports: TAX_REPORTS },
  { key: 'activity', label: 'Activity', reports: ACTIVITY_REPORTS },
  { key: 'support', label: 'Support', reports: SUPPORT_REPORTS },
];
