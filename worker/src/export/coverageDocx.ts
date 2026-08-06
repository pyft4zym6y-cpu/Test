/**
 * Экспорт «Охват аудита и уверенность отчёта» в .docx: Confidence Score и карта
 * 13 видов аудита (что покрыто L0, что требует доступов/внешних сервисов).
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { CoverageReport, LensStatus } from '../coverage.js';

const STATUS_LABEL: Record<LensStatus, string> = {
  covered: '✓ покрыт (L0)', partial: '≈ частично (L0)', external: '⭙ внешний сервис', 'needs-access': '🔒 нужны доступы',
};
const LIME = 'A9D92F';
const INK = '12160A';

const P = (text: string, opts: { bold?: boolean; italics?: boolean } = {}) =>
  new Paragraph({ children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })], spacing: { after: 80 } });

const cell = (text: string, opts: { head?: boolean; w?: number } = {}) =>
  new TableCell({ width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined, shading: opts.head ? { fill: LIME } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text, bold: opts.head, color: opts.head ? INK : undefined })] })] });

const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9DEE6' };
const table = (head: string[], rows: string[][], widths?: number[]) =>
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths?.[i] })) }), ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths?.[i] })) }))] });

export async function exportCoverageDocx(ds: AuditDataset, c: CoverageReport, outPath: string): Promise<void> {
  const kids: (Paragraph | Table)[] = [];
  kids.push(new Paragraph({ text: 'Охват аудита и уверенность отчёта', heading: HeadingLevel.TITLE }));
  kids.push(P(`${ds.client.finalUrl || ds.client.rootUrl} · Commerce OS · тир T${ds.tier} · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));

  kids.push(new Paragraph({ text: 'Confidence Score отчёта', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  kids.push(P(`${c.confidence.score}/${c.confidence.base} — уверенность ${c.confidence.band}.`, { bold: true }));
  kids.push(P('Это достоверность нашего разбора на текущих данных (не состояние бизнеса — то Health Score). Потолок задан тиром.', { italics: true }));
  if (c.confidence.raisedBy.length) {
    kids.push(P('Что поднимет уверенность:', { bold: true }));
    for (const r of c.confidence.raisedBy) kids.push(P(`• ${r}`));
  }

  kids.push(new Paragraph({ text: '13 видов аудита — что покрыто', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  kids.push(P('«Аудит сайта — это все виды аудита, а не выбранные». Пропущенный вид — не пробел, а строка: покрывается по мере доступов и внешних сервисов.', { italics: true }));
  kids.push(table(['Вид аудита', 'Статус', 'Чем / что нужно'], c.lenses.map((l) => [l.name, STATUS_LABEL[l.status], l.note]), [22, 20, 58]));

  await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
}
