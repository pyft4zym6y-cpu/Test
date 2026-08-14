/**
 * Экспорт реестра гипотез (AD-19) в .docx: таблица «гипотеза · основание · как
 * проверить · критерий опровержения · уверенность».
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { HypothesisRegister } from '../hypotheses.js';

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

export async function exportHypothesesDocx(ds: AuditDataset, r: HypothesisRegister, outPath: string): Promise<void> {
  const kids: (Paragraph | Table)[] = [];
  kids.push(new Paragraph({ text: 'Реестр гипотез (AD-19)', heading: HeadingLevel.TITLE }));
  kids.push(P(`${ds.client.finalUrl || ds.client.rootUrl} · Commerce OS · внешний обход витрины без доступов · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));
  if (!r.items.length) {
    kids.push(P('Гипотез не выделено: находки достаточно подтверждены на текущем тире.'));
    await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
    return;
  }
  kids.push(P('Всё, что объясняет находку, но не подтверждено данными клиента, живёт здесь до проверки — со способом проверки и критерием опровержения.', { italics: true }));
  kids.push(table(
    ['ID', 'Вид', 'Гипотеза', 'Основание', 'Как проверить', 'Критерий опровержения', 'Ув.'],
    r.items.map((h) => [h.id, h.area, h.hypothesis, h.basis, h.verifyBy, h.falsifyIf, String(h.confidence)]),
    [6, 10, 22, 16, 20, 20, 6],
  ));
  kids.push(P('По мере доступов гипотеза либо подтверждается (переходит в находку-факт), либо опровергается и снимается.', { italics: true }));
  await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
}
