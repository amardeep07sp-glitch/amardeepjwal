import { generateBarcodeValue, isValidBarcodeValue } from '../src/modules/inventory/barcode.generator.js';

describe('generateBarcodeValue', () => {
  it('generates a valid checksummed EAN13 value', () => {
    const value = generateBarcodeValue('ean13', 42);
    expect(value).toHaveLength(13);
    expect(isValidBarcodeValue('ean13', value)).toBe(true);
  });

  it('generates a valid checksummed EAN8 value', () => {
    const value = generateBarcodeValue('ean8', 7);
    expect(value).toHaveLength(8);
    expect(isValidBarcodeValue('ean8', value)).toBe(true);
  });

  it('generates a valid checksummed UPC value', () => {
    const value = generateBarcodeValue('upc', 123);
    expect(value).toHaveLength(12);
    expect(isValidBarcodeValue('upc', value)).toBe(true);
  });

  it('generates a Code128 value in the expected format', () => {
    const value = generateBarcodeValue('code128', 5);
    expect(value).toBe('C128-00000005');
    expect(isValidBarcodeValue('code128', value)).toBe(true);
  });

  it('generates a unique-looking QR value', () => {
    const first = generateBarcodeValue('qr', 1);
    const second = generateBarcodeValue('qr', 1);
    expect(first).not.toBe(second);
    expect(isValidBarcodeValue('qr', first)).toBe(true);
  });

  it('throws for an unknown barcode type', () => {
    expect(() => generateBarcodeValue('not_a_type', 1)).toThrow('Unknown barcode type');
  });
});

describe('isValidBarcodeValue', () => {
  it('rejects an EAN13 value with a wrong check digit', () => {
    const valid = generateBarcodeValue('ean13', 42);
    const lastDigit = Number(valid[12]);
    const corrupted = `${valid.slice(0, 12)}${(lastDigit + 1) % 10}`;
    expect(isValidBarcodeValue('ean13', corrupted)).toBe(false);
  });

  it('rejects a non-numeric EAN13 value', () => {
    expect(isValidBarcodeValue('ean13', 'not-a-number')).toBe(false);
  });

  it('rejects an empty value', () => {
    expect(isValidBarcodeValue('ean13', '')).toBe(false);
  });
});
