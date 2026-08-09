import { v4 as uuidv4 } from 'uuid';
import { BARCODE_TYPES } from './inventory.constants.js';

// Pure, DB-free value generation/validation (same convention as
// priceCalculator.js). Only produces the VALUE - no image is ever generated
// or stored server-side; the frontend renders a scannable barcode/QR image
// on demand from this value using the browser builds of jsbarcode/qrcode.

const checksumDigit = (digits) => {
  // Standard EAN/UPC weighted-sum algorithm: alternating x1/x3 weights from
  // the rightmost digit, check digit makes the total a multiple of 10.
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const weight = (digits.length - i) % 2 === 0 ? 1 : 3;
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
};

function generateNumericBarcode(totalLength, sequenceNumber) {
  const body = String(sequenceNumber).padStart(totalLength - 1, '0').slice(-(totalLength - 1));
  return `${body}${checksumDigit(body)}`;
}

export function generateBarcodeValue(barcodeType, sequenceNumber) {
  switch (barcodeType) {
    case BARCODE_TYPES.EAN13:
      return generateNumericBarcode(13, sequenceNumber);
    case BARCODE_TYPES.EAN8:
      return generateNumericBarcode(8, sequenceNumber);
    case BARCODE_TYPES.UPC:
      return generateNumericBarcode(12, sequenceNumber);
    case BARCODE_TYPES.CODE128:
      return `C128-${String(sequenceNumber).padStart(8, '0')}`;
    case BARCODE_TYPES.CODE39:
      return `C39-${String(sequenceNumber).padStart(8, '0')}`;
    case BARCODE_TYPES.QR:
      return uuidv4();
    default:
      throw new Error(`Unknown barcode type: ${barcodeType}`);
  }
}

export function isValidBarcodeValue(barcodeType, value) {
  if (!value) return false;
  switch (barcodeType) {
    case BARCODE_TYPES.EAN13:
      return /^\d{13}$/.test(value) && Number(value[12]) === checksumDigit(value.slice(0, 12));
    case BARCODE_TYPES.EAN8:
      return /^\d{8}$/.test(value) && Number(value[7]) === checksumDigit(value.slice(0, 7));
    case BARCODE_TYPES.UPC:
      return /^\d{12}$/.test(value) && Number(value[11]) === checksumDigit(value.slice(0, 11));
    case BARCODE_TYPES.CODE128:
    case BARCODE_TYPES.CODE39:
      return /^[A-Z0-9\-. $/+%]+$/.test(value);
    case BARCODE_TYPES.QR:
      return value.trim().length > 0;
    default:
      return false;
  }
}
