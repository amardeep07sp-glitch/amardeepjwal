import { describe, it, expect } from '@jest/globals';
import { buildCsv, buildExcel, buildPdf } from '../src/modules/reports/export.util.js';

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount' },
];
const ROWS = [
  { name: 'Alpha', amount: 100 },
  { name: 'Beta', amount: 250 },
];

describe('export.util', () => {
  it('buildCsv produces a header row and one row per record', () => {
    const csv = buildCsv(COLUMNS, ROWS);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Name');
    expect(lines[0]).toContain('Amount');
    expect(lines[1]).toContain('Alpha');
    expect(lines[2]).toContain('Beta');
  });

  it('buildCsv fills a missing field with an empty string rather than throwing', () => {
    const csv = buildCsv(COLUMNS, [{ name: 'Gamma' }]);
    expect(csv).toContain('Gamma');
  });

  it('buildExcel resolves to a non-empty buffer', async () => {
    const buffer = await buildExcel(COLUMNS, ROWS, 'Test Sheet');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('buildPdf resolves to a non-empty PDF buffer', async () => {
    const buffer = await buildPdf(COLUMNS, ROWS, 'Test Report');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
