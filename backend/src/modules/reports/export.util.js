import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// ===========================================================================
// THE single place every report's CSV/Excel/PDF export is generated. Phases
// 6-8 each built a bespoke <module>.csv.js/.pdf.js per module because each
// exported a fixed, module-specific shape; Phase 11 introduces ~9 report
// domains that would otherwise repeat that csv-stringify/exceljs/pdfkit
// setup 9+ times over. Every report instead produces the same generic
// {columns, rows} shape and hands it to this file - "No duplicate code" for
// the Export Engine. "Print" is deliberately NOT a fourth format here - it
// is a frontend concern (render the on-screen table and call
// window.print()), the same way every real print pipeline works; a
// server-rendered "print format" would just be a fourth PDF variant.
// ===========================================================================

export function buildCsv(columns, rows) {
  const data = rows.map((row) => Object.fromEntries(columns.map((c) => [c.key, row[c.key] ?? ''])));
  return stringify(data, { header: true, columns: columns.map((c) => ({ key: c.key, header: c.header })) });
}

export async function buildExcel(columns, rows, sheetName = 'Report') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

export function buildPdf(columns, rows, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8);

    const colWidth = (doc.page.width - 80) / columns.length;
    const drawRow = (values, isHeader) => {
      const y = doc.y;
      if (y > doc.page.height - 60) {
        doc.addPage();
      }
      const rowY = doc.y;
      values.forEach((value, i) => doc.text(String(value ?? ''), 40 + i * colWidth, rowY, { width: colWidth }));
      doc.moveDown(isHeader ? 0.6 : 0.7);
    };

    drawRow(columns.map((c) => c.header), true);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
    doc.moveDown(0.3);

    rows.forEach((row) => drawRow(columns.map((c) => row[c.key])));

    doc.end();
  });
}

// Express response helper - every report controller calls this one function
// instead of hand-rolling Content-Type/Content-Disposition per format.
export async function sendReportExport(res, format, { columns, rows, filename, title }) {
  if (format === 'excel') {
    const buffer = await buildExcel(columns, rows, title);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.send(buffer);
    return;
  }
  if (format === 'pdf') {
    const buffer = await buildPdf(columns, rows, title);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(buffer);
    return;
  }
  const csv = buildCsv(columns, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}
