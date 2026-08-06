/**
 * Экспорт «Эталонный прототип ↔ композиция клиента» в .docx: постранично таблица
 * блок-за-блоком (эталонный блок · важность · есть/нет у клиента · роль · глава),
 * покрытие композиции и путь клиента против эталонного (нарратив). Аналог
 * примеров pdp_comparison / lanavitta_vs_reference.
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { PrototypeReport, BlockVerdict } from '../prototype.js';

const MARK: Record<BlockVerdict, string> = { present: '✓ есть', missing: '✕ нет' };
const LIME = 'A9D92F';
const INK = '12160A';
const MISS = 'C0392B';

const P = (text: string, opts: { bold?: boolean; italics?: boolean } = {}) =>
  new Paragraph({ children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })], spacing: { after: 80 } });

const cell = (text: string, opts: { head?: boolean; w?: number; color?: string } = {}) =>
  new TableCell({
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.head ? { fill: LIME } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.head, color: opts.head ? INK : opts.color })] })],
  });

const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9DEE6' };
const table = (head: string[], rows: { cells: string[]; colors?: (string | undefined)[] }[], widths?: number[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths?.[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.cells.map((c, i) => cell(c, { w: widths?.[i], color: r.colors?.[i] })) })),
    ],
  });

export async function exportPrototypeDocx(ds: AuditDataset, r: PrototypeReport, outPath: string): Promise<void> {
  const kids: (Paragraph | Table)[] = [];
  const site = ds.client.finalUrl || ds.client.rootUrl;

  kids.push(new Paragraph({ text: 'Эталонный прототип ↔ композиция клиента', heading: HeadingLevel.TITLE }));
  kids.push(P(`${site} · Commerce OS · слой L0 (внешний обход) · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));
  kids.push(P('Страница разбирается как композиция — состав и порядок блоков — и сверяется с эталонной композицией своего типа (главы UX-энциклопедии: PDP 23, PLP 22, Cart 24, Checkout 25). Результат — путь клиента против эталонного пути. Наблюдение L0; «не обнаружено» ≠ «отсутствует».', { italics: true }));

  if (!r.pages.length) {
    kids.push(P('Страницы не разобраны (сайт недоступен/бот-защита).'));
    await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
    return;
  }

  if (r.narrative?.summary) {
    kids.push(new Paragraph({ text: 'Резюме', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    kids.push(P(r.narrative.summary));
  }

  for (const pg of r.pages) {
    kids.push(new Paragraph({ text: `${pg.title} — ${pg.url}`, heading: HeadingLevel.HEADING_1, spacing: { before: 220, after: 90 } }));
    kids.push(P(`Покрытие эталонной композиции: ${pg.coverage}%. Эталон: ${pg.chapter}.`, { bold: true }));
    if (pg.principle) kids.push(P(`Принцип эталона: ${pg.principle}`, { italics: true }));
    const narr = r.narrative?.perPage.find((x) => x.title === pg.title);
    if (narr) kids.push(P(narr.pathVsReference));
    kids.push(table(
      ['Эталонный блок', 'Важн.', 'У клиента', 'Роль в пути клиента', 'Глава'],
      pg.blocks.map((b) => ({ cells: [b.name, b.weight, MARK[b.verdict], b.role, b.chapter], colors: [undefined, undefined, b.verdict === 'missing' ? MISS : undefined, undefined, undefined] })),
      [24, 10, 12, 40, 14],
    ));
    if (pg.missingCore.length) kids.push(P(`Отсутствуют ядровые блоки: ${pg.missingCore.join(', ')} — путь клиента рвётся здесь.`, { bold: true }));
  }

  kids.push(P('', {}));
  kids.push(P('Метод: страница = композиция, а не набор дефектов. С доступами уточняется, скрыт блок или отсутствует; коды и структура сохраняются.', { italics: true }));
  await writeFile(outPath, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
}
