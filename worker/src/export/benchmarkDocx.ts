/**
 * Экспорт конкурентного бенчмарка (AD-11) в .docx: рейтинг витрин по взвешенному
 * индексу, позиции клиента против рынка по параметрам, white space.
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { BenchmarkReport, ParamRow } from '../competitor.js';

const POS: Record<ParamRow['position'], string> = { lead: '▲ ведём', par: '≈ наравне', behind: '▼ отстаём' };
const POS_COLOR: Record<ParamRow['position'], string | undefined> = { lead: '2E7D32', par: undefined, behind: 'C0392B' };
const LIME = 'A9D92F';
const INK = '12160A';

const P = (text: string, opts: { bold?: boolean; italics?: boolean } = {}) =>
  new Paragraph({ children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })], spacing: { after: 80 } });

const cell = (text: string, opts: { head?: boolean; w?: number; color?: string; bold?: boolean } = {}) =>
  new TableCell({ width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined, shading: opts.head ? { fill: LIME } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text, bold: opts.head || opts.bold, color: opts.head ? INK : opts.color })] })] });

const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9DEE6' };
const table = (head: string[], rows: { cells: string[]; colors?: (string | undefined)[]; bold?: boolean }[], widths?: number[]) =>
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths?.[i] })) }), ...rows.map((r) => new TableRow({ children: r.cells.map((c, i) => cell(c, { w: widths?.[i], color: r.colors?.[i], bold: r.bold })) }))] });

export async function exportBenchmarkDocx(ds: AuditDataset, r: BenchmarkReport, outPath: string): Promise<void> {
  const kids: (Paragraph | Table)[] = [];
  kids.push(new Paragraph({ text: 'Конкурентный бенчмарк', heading: HeadingLevel.TITLE }));
  kids.push(P(`${ds.client.finalUrl || ds.client.rootUrl} · Commerce OS · AD-11 · слой L0 · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));
  if (r.narrative?.summary) kids.push(P(r.narrative.summary));
  kids.push(P(`Индекс клиента: ${r.clientIndex}/100 — место ${r.clientRank} из ${r.totalSites}.`, { bold: true }));

  kids.push(new Paragraph({ text: 'Рейтинг витрин (взвешенный индекс)', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  kids.push(table(['#', 'Сайт', 'Индекс'], r.ranking.map((s, i) => ({ cells: [String(i + 1), `${s.isClient ? '★ ' : ''}${s.name}`, String(s.index)], bold: s.isClient })), [8, 74, 18]));

  kids.push(new Paragraph({ text: 'Позиции по параметрам (клиент против рынка)', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  kids.push(table(['Параметр', 'Клиент', 'Лучший у рынка', 'Позиция'], r.params.map((p) => ({ cells: [p.name, String(p.client), String(p.marketMax), POS[p.position]], colors: [undefined, undefined, undefined, POS_COLOR[p.position]] })), [46, 14, 22, 18]));
  if (r.narrative?.positioning) kids.push(P(r.narrative.positioning));

  kids.push(new Paragraph({ text: 'White space — свободная ниша', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  if (r.whiteSpace.length) { kids.push(P('Параметры, слабые у всех на рынке (возможность вырваться вперёд):')); for (const w of r.whiteSpace) kids.push(P(`• ${w}`)); }
  else kids.push(P('Явной свободной ниши по разобранным параметрам не видно — выигрыш в исполнении.'));
  if (r.narrative?.whiteSpace) kids.push(P(r.narrative.whiteSpace));

  await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
}
