export const serializeInvoice = (invoice) => {
  const plain = typeof invoice.toObject === 'function' ? invoice.toObject() : invoice;
  const order = plain.order;

  return {
    id: plain._id,
    invoiceNumber: plain.invoiceNumber,
    invoiceDate: plain.invoiceDate,
    order: order && typeof order === 'object'
      ? {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          grandTotal: order.grandTotal,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerSnapshot?.name || order.customer?.displayName || '',
          createdAt: order.createdAt,
        }
      : { id: order?.toString?.() ?? order },
    taxSummary: plain.taxSummary,
    createdAt: plain.createdAt,
  };
};

export const serializeInvoiceList = (invoices) => invoices.map(serializeInvoice);
