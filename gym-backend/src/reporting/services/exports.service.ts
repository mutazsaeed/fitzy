/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { ReconciliationQueryDto } from '../dto/reconciliation.query.dto';
import { ReconciliationService } from './reconciliation.service';

@Injectable()
export class ExportsService {
  constructor(private readonly reconciliation: ReconciliationService) {}

  // -------------------------------------------------
  // CSV export for Monthly Reconciliation
  // -------------------------------------------------
  async exportMonthlyReconciliationCsv(
    query: ReconciliationQueryDto,
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    const data = await this.reconciliation.buildRecoExport(query);

    const header = [
      'gymId',
      'gymName',
      'visitPrice',
      'visits',
      'dues',
      'invoiceNumber',
      'periodFrom',
      'periodTo',
    ];
    const lines: string[] = [header.join(',')];

    for (const it of data.items) {
      const row = [
        String(it.gymId),
        `"${(it.gymName ?? '').replace(/"/g, '""')}"`,
        it.visitPrice === null ? '' : String(it.visitPrice),
        String(it.visits),
        String(it.dues),
        `"${it.invoiceNumber}"`,
        data.range.from,
        data.range.to,
      ];
      lines.push(row.join(','));
    }

    // Totals row
    lines.push(
      ['TOTALS', '', '', String(data.totals.totalVisits), String(data.totals.totalDues), '', '', ''].join(','),
    );

    const csv = lines.join('\n');
    const filename = `reconciliation_${data.invoiceMonthTag}.csv`;
    return { filename, mime: 'text/csv; charset=utf-8', buffer: Buffer.from(csv, 'utf8') };
  }

  // -------------------------------------------------
  // PDF export for Monthly Reconciliation
  // -------------------------------------------------
  async exportMonthlyReconciliationPdf(
    query: ReconciliationQueryDto,
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    const data = await this.reconciliation.buildRecoExport(query);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    return await new Promise((resolve) => {
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const filename = `reconciliation_${data.invoiceMonthTag}.pdf`;
        resolve({ filename, mime: 'application/pdf', buffer });
      });

      // Header
      doc.fontSize(16).text('Monthly Reconciliation (All Clubs)', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .text(`Period: ${data.range.from} → ${data.range.to}  (TZ: ${data.range.timezone})`, {
          align: 'center',
        });
      doc.moveDown();

      // Table header
      const startX = doc.x;
      const colWidths = [50, 180, 60, 60, 80, 100] as const; // id, name, price, visits, dues, invoice
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      const headers = ['Gym ID', 'Gym Name', 'Price', 'Visits', 'Dues', 'Invoice #'] as const;

      doc
        .fontSize(10)
        .text(headers[0], startX, doc.y, { width: colWidths[0], continued: true })
        .text(headers[1], undefined, undefined, { width: colWidths[1], continued: true })
        .text(headers[2], undefined, undefined, { width: colWidths[2], continued: true, align: 'right' })
        .text(headers[3], undefined, undefined, { width: colWidths[3], continued: true, align: 'right' })
        .text(headers[4], undefined, undefined, { width: colWidths[4], continued: true, align: 'right' })
        .text(headers[5], undefined, undefined, { width: colWidths[5] });

      doc.moveDown(0.3);
      doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).stroke();
      doc.moveDown(0.2);

      // Rows
      doc.fontSize(9);
      for (const it of data.items) {
        const rowY = doc.y;

        doc
          .text(String(it.gymId), startX, rowY, { width: colWidths[0], continued: true })
          .text(it.gymName ?? '', undefined, undefined, { width: colWidths[1], continued: true })
          .text(it.visitPrice === null ? '-' : String(it.visitPrice), undefined, undefined, {
            width: colWidths[2],
            continued: true,
            align: 'right',
          })
          .text(String(it.visits), undefined, undefined, { width: colWidths[3], continued: true, align: 'right' })
          .text(String(it.dues), undefined, undefined, { width: colWidths[4], continued: true, align: 'right' })
          .text(it.invoiceNumber, undefined, undefined, { width: colWidths[5] });

        // page break handling
        const bottomMargin = 80;
        if (doc.y > doc.page.height - bottomMargin) {
          doc.addPage();

          // re-draw header on new page
          doc
            .fontSize(10)
            .text(headers[0], startX, doc.y, { width: colWidths[0], continued: true })
            .text(headers[1], undefined, undefined, { width: colWidths[1], continued: true })
            .text(headers[2], undefined, undefined, { width: colWidths[2], continued: true, align: 'right' })
            .text(headers[3], undefined, undefined, { width: colWidths[3], continued: true, align: 'right' })
            .text(headers[4], undefined, undefined, { width: colWidths[4], continued: true, align: 'right' })
            .text(headers[5], undefined, undefined, { width: colWidths[5] });

          doc.moveDown(0.3);
          doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).stroke();
          doc.moveDown(0.2);
          doc.fontSize(9);
        }
      }

      // Totals
      doc.moveDown(0.5);
      doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).stroke();
      doc.moveDown(0.2);

      doc
        .fontSize(10)
        .text('Totals', startX, doc.y, { width: colWidths[0] + colWidths[1], continued: true })
        .text('', undefined, undefined, { width: colWidths[2], continued: true })
        .text(String(data.totals.totalVisits), undefined, undefined, {
          width: colWidths[3],
          continued: true,
          align: 'right',
        })
        .text(String(data.totals.totalDues), undefined, undefined, {
          width: colWidths[4],
          continued: true,
          align: 'right',
        })
        .text('', undefined, undefined, { width: colWidths[5] });

      // Footer
      doc.moveDown(1);
      doc.fontSize(8).text('Generated by ExportsService', { align: 'right' });

      doc.end();
    });
  }
}
