const { createObjectCsvStringifier } = require('csv-writer');
const PdfPrinter = require('pdfmake');

// ─── CSV Generation ──────────────────────────────────────────────────────────
async function generateCsv(data, headers) {
  if (!data || data.length === 0) return Buffer.from('No data available');
  const csvStringifier = createObjectCsvStringifier({
    header: headers.map(h => ({ id: h, title: h.replace(/_/g, ' ').toUpperCase() })),
  });
  const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);
  return Buffer.from(csv, 'utf-8');
}

// ─── PDF Generation ──────────────────────────────────────────────────────────
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

async function generatePdf(data, headers, title) {
  return new Promise((resolve, reject) => {
    try {
      const printer = new PdfPrinter(fonts);

      const tableHeaders = headers.map(h => ({
        text: h.replace(/_/g, ' ').toUpperCase(),
        style: 'tableHeader',
        fillColor: '#001736',
        color: '#ffffff',
      }));

      const tableRows = (data || []).slice(0, 100).map(row =>
        headers.map(h => ({
          text: String(row[h] ?? ''),
          style: 'tableCell',
        }))
      );

      const docDef = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        content: [
          { text: 'Module 9 — Analytics & System Governance', style: 'header' },
          { text: `Report: ${title.replace(/_/g, ' ').toUpperCase()}`, style: 'subheader' },
          { text: `Generated: ${new Date().toISOString()}`, style: 'meta' },
          { text: ' ' },
          {
            table: {
              headerRows: 1,
              widths: headers.map(() => '*'),
              body: [tableHeaders, ...tableRows],
            },
            layout: 'lightHorizontalLines',
          },
          { text: ' ' },
          { text: 'CONFIDENTIAL — PII fields have been masked per platform governance policy.', style: 'footer' },
        ],
        styles: {
          header: { fontSize: 18, bold: true, color: '#001736', margin: [0, 0, 0, 4] },
          subheader: { fontSize: 13, bold: true, color: '#405f91', margin: [0, 0, 0, 2] },
          meta: { fontSize: 9, color: '#888', margin: [0, 0, 0, 10] },
          tableHeader: { bold: true, fontSize: 9 },
          tableCell: { fontSize: 8, margin: [2, 2, 2, 2] },
          footer: { fontSize: 8, color: '#ba1a1a', italics: true },
        },
        defaultStyle: { font: 'Helvetica' },
      };

      const pdfDoc = printer.createPdfKitDocument(docDef);
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCsv, generatePdf };
