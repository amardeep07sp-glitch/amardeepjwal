import PDFDocument from 'pdfkit';

// Renders a customer statement (profile + order/lifetime-value summary +
// wallet + loyalty) straight from already-fetched, already-serialized data -
// same "no separate document model, always derived from the live source of
// truth" philosophy as order/invoice.pdf.js.
export function buildCustomerStatementPdf({ customer, orderSummary, wallet, loyalty }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Customer Statement', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Customer Code: ${customer.customerCode}`);
    doc.text(`Name: ${customer.displayName}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`);
    doc.text(`Status: ${customer.status}`);
    doc.text(`Customer Type: ${customer.customerType}`);
    if (customer.companyName) doc.text(`Company: ${customer.companyName}`);
    if (customer.gstNumber) doc.text(`GST Number: ${customer.gstNumber}`);
    doc.moveDown();

    doc.fontSize(12).text('Order Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Orders: ${orderSummary.orderCount}`);
    doc.text(`Lifetime Value: ${customer.preferredCurrency ?? 'INR'} ${orderSummary.lifetimeValue.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(12).text('Wallet', { underline: true });
    doc.fontSize(10);
    doc.text(`Balance: ${customer.preferredCurrency ?? 'INR'} ${(wallet?.balance ?? 0).toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(12).text('Loyalty', { underline: true });
    doc.fontSize(10);
    doc.text(`Current Points: ${loyalty?.currentPoints ?? 0}`);
    doc.text(`Lifetime Points Earned: ${loyalty?.lifetimePointsEarned ?? 0}`);
    doc.text(`Tier: ${loyalty?.currentTier ?? 'silver'}`);

    doc.end();
  });
}
