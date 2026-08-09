import PDFDocument from 'pdfkit';

// Renders straight from the Order's own persisted fields plus a Settings
// snapshot passed in by the caller (invoice.service.js) - no separate
// invoice-line-item model, so an invoice can never drift from the order it
// describes. Any "Sold By"/bank block whose underlying Settings fields are
// still blank is simply omitted rather than printing placeholder text -
// same "no fake gap" rule the rest of this app follows.

const GOLD = '#B8860B';
const INK = '#1A1A1A';
const MUTED = '#6B6B6B';
const BORDER = '#D9D3C7';
const PANEL = '#FAF7F0';

const money = (value, currency = 'INR') => {
  const symbol = currency === 'INR' ? 'Rs. ' : `${currency} `;
  return `${symbol}${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function threeDigitsToWords(num) {
  let str = '';
  if (num >= 100) {
    str += `${ONES[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num >= 20) {
    str += `${TENS[Math.floor(num / 10)]} `;
    num %= 10;
  }
  if (num > 0) str += `${ONES[num]} `;
  return str.trim();
}

// Indian numbering (lakh/crore) - a pure function of the real grandTotal,
// the conventional finishing touch a formal Indian tax invoice includes,
// not a fabricated figure.
function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let n = rupees;
  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  let words = `${parts.join(' ')} Rupees`;
  if (paise > 0) words += ` and ${threeDigitsToWords(paise)} Paise`;
  return `${words} Only`;
}

const PAYMENT_METHOD_LABEL = { cod: 'Cash on Delivery', razorpay: 'Online Payment (Razorpay)' };
const PAYMENT_STATUS_LABEL = { paid: 'PAID', pending: 'PENDING', partially_paid: 'PARTIALLY PAID', refunded: 'REFUNDED' };

function formatAddress(a) {
  if (!a?.line1) return null;
  const lines = [`${a.line1}${a.line2 ? `, ${a.line2}` : ''}`, `${a.city ?? ''}, ${a.state ?? ''} ${a.postalCode ?? ''}`.trim(), a.country || ''];
  return lines.filter(Boolean);
}

export function buildInvoicePdf({ invoice, order, items, seller }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    // --- Header: seller identity ------------------------------------------
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text(seller.legalBusinessName || seller.siteName, left, 40);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    const sellerAddrLines = formatAddress(seller.registeredAddress) ?? (seller.address ? [seller.address] : []);
    sellerAddrLines.forEach((line) => doc.text(line));
    const gstinPanBits = [seller.gstin && `GSTIN: ${seller.gstin}`, seller.panNumber && `PAN: ${seller.panNumber}`].filter(Boolean);
    if (gstinPanBits.length) doc.text(gstinPanBits.join('   |   '));
    const contactBits = [seller.contactPhone, seller.contactEmail].filter(Boolean);
    if (contactBits.length) doc.text(contactBits.join('   |   '));

    doc.moveTo(left, 118).lineTo(left + pageWidth, 118).strokeColor(GOLD).lineWidth(1.5).stroke();

    doc.font('Helvetica-Bold').fontSize(16).fillColor(INK).text('TAX INVOICE', left, 128, { width: pageWidth, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('(Original for Recipient)', { width: pageWidth, align: 'center' });

    // --- Meta strip: invoice #, date, order #, payment ---------------------
    let y = 158;
    const metaBoxHeight = 46;
    doc.rect(left, y, pageWidth, metaBoxHeight).fillAndStroke(PANEL, BORDER);
    const colW = pageWidth / 4;
    const metaCells = [
      ['Invoice Number', invoice.invoiceNumber],
      ['Invoice Date', new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      ['Order Number', order.orderNumber],
      ['Payment', `${PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}${order.paymentMethod ? ` (${PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod})` : ''}`],
    ];
    metaCells.forEach(([label, value], i) => {
      const x = left + i * colW + 10;
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(label.toUpperCase(), x, y + 8, { width: colW - 16 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(value, x, y + 21, { width: colW - 16 });
    });

    // --- Sold By / Bill To / Ship To boxes ----------------------------------
    y += metaBoxHeight + 14;
    const boxW = (pageWidth - 16) / 3;
    const buyerName = order.customerSnapshot?.name || order.customer?.name || '';
    const billing = formatAddress(order.billingAddressSnapshot);
    const shipping = formatAddress(order.shippingAddressSnapshot);
    const shipSameAsBill = shipping && billing && shipping.join('|') === billing.join('|');

    const soldByLines = [
      ...sellerAddrLines,
      ...(seller.gstin ? [`GSTIN: ${seller.gstin}`] : []),
    ];
    const billToLines = [buyerName, ...(billing ?? []), ...(order.customerSnapshot?.phone ? [`Phone: ${order.customerSnapshot.phone}`] : [])];
    const shipToLines = shipSameAsBill ? ['Same as Billing Address'] : [buyerName, ...(shipping ?? [])];

    const boxHeights = [soldByLines, billToLines, shipToLines].map((lines) => 36 + lines.length * 12);
    const boxHeight = Math.max(...boxHeights, 70);

    [
      { title: 'Sold By', lines: soldByLines },
      { title: 'Bill To', lines: billToLines },
      { title: 'Ship To', lines: shipToLines },
    ].forEach((block, i) => {
      const x = left + i * (boxW + 8);
      doc.rect(x, y, boxW, boxHeight).strokeColor(BORDER).lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GOLD).text(block.title.toUpperCase(), x + 10, y + 8);
      doc.font('Helvetica').fontSize(8.5).fillColor(INK);
      let lineY = y + 22;
      block.lines.forEach((line) => {
        doc.text(line, x + 10, lineY, { width: boxW - 20 });
        lineY += 12;
      });
    });

    // --- Items table ---------------------------------------------------------
    y += boxHeight + 20;
    const FIXED_COL_WIDTH = 24 + 75 + 40 + 90 + 90; // no + sku + qty + rate + amount
    const cols = [
      { key: 'no', label: '#', width: 24, align: 'left' },
      { key: 'item', label: 'Item', width: pageWidth - FIXED_COL_WIDTH, align: 'left' },
      { key: 'sku', label: 'SKU', width: 75, align: 'left' },
      { key: 'qty', label: 'Qty', width: 40, align: 'center' },
      { key: 'rate', label: 'Rate', width: 90, align: 'right' },
      { key: 'amount', label: 'Amount', width: 90, align: 'right' },
    ];
    const rowHeight = 20;
    const headerHeight = 22;
    const bottomMargin = 60;

    const drawTableHeader = (yPos) => {
      doc.rect(left, yPos, pageWidth, headerHeight).fill(INK);
      let x = left;
      cols.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF').text(col.label, x + 6, yPos + 7, { width: col.width - 12, align: col.align });
        x += col.width;
      });
      return yPos + headerHeight;
    };

    y = drawTableHeader(y);

    items.forEach((item, index) => {
      if (y + rowHeight > doc.page.height - bottomMargin) {
        doc.addPage();
        y = drawTableHeader(40);
      }
      if (index % 2 === 1) doc.rect(left, y, pageWidth, rowHeight).fill(PANEL);
      let x = left;
      const cells = {
        no: String(index + 1),
        item: item.productSnapshot?.name || item.sku || '-',
        sku: item.sku || '-',
        qty: String(item.quantity),
        rate: money(item.unitPrice, order.currency),
        amount: money(item.total, order.currency),
      };
      cols.forEach((col) => {
        doc.font('Helvetica').fontSize(8.5).fillColor(INK).text(cells[col.key], x + 6, y + 6, { width: col.width - 12, align: col.align });
        x += col.width;
      });
      y += rowHeight;
    });
    doc.moveTo(left, y).lineTo(left + pageWidth, y).strokeColor(BORDER).lineWidth(1).stroke();

    // --- Totals summary --------------------------------------------------------
    y += 14;
    if (y > doc.page.height - 220) {
      doc.addPage();
      y = 40;
    }
    const summaryW = 240;
    const summaryX = left + pageWidth - summaryW;
    const summaryRows = [
      ['Subtotal', money(order.subtotal, order.currency)],
      ...(order.discount > 0 ? [['Discount', `-${money(order.discount, order.currency)}`]] : []),
      ...(order.couponDiscount > 0 ? [[`Coupon${order.couponCode ? ` (${order.couponCode})` : ''}`, `-${money(order.couponDiscount, order.currency)}`]] : []),
      ...(invoice.taxSummary?.taxType === 'intra_state'
        ? [
            [`CGST @ ${(invoice.taxSummary.taxPercentage / 2).toFixed(2)}%`, money(invoice.taxSummary.cgstAmount, order.currency)],
            [`SGST @ ${(invoice.taxSummary.taxPercentage / 2).toFixed(2)}%`, money(invoice.taxSummary.sgstAmount, order.currency)],
          ]
        : invoice.taxSummary?.taxType === 'inter_state'
          ? [[`IGST @ ${invoice.taxSummary.taxPercentage.toFixed(2)}%`, money(invoice.taxSummary.igstAmount, order.currency)]]
          : [['Tax', money(order.tax, order.currency)]]),
      ...(order.shippingCharge > 0 ? [['Shipping', money(order.shippingCharge, order.currency)]] : [['Shipping', 'Free']]),
      ...(order.handlingCharge > 0 ? [['Handling', money(order.handlingCharge, order.currency)]] : []),
    ];
    summaryRows.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, summaryX, y, { width: summaryW - 90 });
      doc.font('Helvetica').fontSize(9).fillColor(INK).text(value, summaryX + summaryW - 90, y, { width: 90, align: 'right' });
      y += 15;
    });

    y += 4;
    doc.rect(summaryX, y, summaryW, 26).fill(GOLD);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF').text('Grand Total', summaryX + 10, y + 7);
    doc.text(money(order.grandTotal, order.currency), summaryX, y + 7, { width: summaryW - 10, align: 'right' });
    y += 38;

    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED).text(`Amount in words: ${amountInWords(order.grandTotal)}`, left, y, { width: pageWidth });
    y += 24;

    // --- Bank details (only if configured) --------------------------------
    const bank = seller.bankDetails;
    const hasBankDetails = bank && (bank.accountNumber || bank.ifscCode);
    if (hasBankDetails) {
      if (y > doc.page.height - 140) {
        doc.addPage();
        y = 40;
      }
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text('BANK DETAILS FOR PAYMENT', left, y);
      y += 14;
      const bankLines = [
        bank.accountHolderName && `Account Name: ${bank.accountHolderName}`,
        bank.bankName && `Bank: ${bank.bankName}${bank.branch ? `, ${bank.branch}` : ''}`,
        bank.accountNumber && `Account No: ${bank.accountNumber}`,
        bank.ifscCode && `IFSC: ${bank.ifscCode}`,
      ].filter(Boolean);
      doc.font('Helvetica').fontSize(8.5).fillColor(INK);
      bankLines.forEach((line) => {
        doc.text(line, left, y);
        y += 12;
      });
      y += 8;
    }

    // --- Terms & footer -----------------------------------------------------
    if (seller.invoiceTerms) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 40;
      }
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text('TERMS & CONDITIONS', left, y);
      y += 13;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(seller.invoiceTerms, left, y, { width: pageWidth });
    }

    // Page numbers + computer-generated note on every page. Positioned
    // comfortably inside the bottom margin (not flush against it) - text()
    // still auto-paginates even at an explicit y if it thinks the line
    // would spill past `page.height - margins.bottom`, so placing it AT
    // that boundary was silently appending a blank extra page every time.
    const footerY = doc.page.height - doc.page.margins.bottom - 14;
    const pageRange = doc.bufferedPageRange();
    for (let i = pageRange.start; i < pageRange.start + pageRange.count; i += 1) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(
        'This is a computer-generated invoice and does not require a physical signature.',
        left,
        footerY,
        { width: pageWidth - 60, align: 'left', lineBreak: false }
      );
      doc.text(`Page ${i + 1} of ${pageRange.count}`, left, footerY, { width: pageWidth, align: 'right', lineBreak: false });
    }

    doc.end();
  });
}
