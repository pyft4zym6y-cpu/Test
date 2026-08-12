/**
 * Экспорт UX/UI-разбора в .docx: постраничная сверка дизайна с AQC-эталоном,
 * таблицы критериев (severity, наблюдение, эталон), конкурентный край и
 * приоритетные правки. Сопроводительный документ первого блока аудита (L0).
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { UxUiReport, Verdict } from '../uxui.js';

const shot = (b64?: string): Paragraph[] => {
  if (!b64) return [];
  try {
    return [new Paragraph({ children: [new ImageRun({ type: 'jpg', data: Buffer.from(b64, 'base64'), transformation: { width: 520, height: 342 } })], spacing: { after: 100 } })];
  } catch { return []; }
};

const MARK: Record<Verdict, string> = { pass: '✓', warn: '≈', fail: '✕', na: '—' };
const LIME = 'A9D92F';
const INK = '12160A';

const P = (text: string, opts: { bold?: boolean; italics?: boolean; bullet?: boolean } = {}) =>
  new Paragraph({ children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })], ...(opts.bullet ? { bullet: { level: 0 } } : {}), spacing: { after: 80 } });

const cell = (text: string, opts: { bold?: boolean; head?: boolean; w?: number } = {}) =>
  new TableCell({
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.head ? { fill: LIME } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || opts.head, color: opts.head ? INK : undefined })] })],
  });

const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9DEE6' };
const table = (head: string[], rows: string[][], widths?: number[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths?.[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths?.[i] })) })),
    ],
  });

export async function exportUxUiDocx(ds: AuditDataset, r: UxUiReport, outPath: string): Promise<void> {
  const kids: (Paragraph | Table)[] = [];
  const site = ds.client.finalUrl || ds.client.rootUrl;

  kids.push(new Paragraph({ text: `UX/UI-разбор страниц против эталона`, heading: HeadingLevel.TITLE }));
  kids.push(P(`${site} · Commerce OS · внешний обход витрины без доступов · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));
  kids.push(P('Сверка с эталоном композиции Commerce OS. Каждый критерий — атомарный стандарт с severity и условием Pass. ✓ выполнено · ≈ частично · ✕ провал · — неприменимо. Оценки — наблюдение внешнего обхода, не факт по данным клиента; «не обнаружено» ≠ «отсутствует».', { italics: true }));

  if (!r.pages.length) {
    kids.push(P('Страницы не удалось разобрать (сайт недоступен или бот-защита). Разбор появится после успешного обхода или с доступами.'));
    const doc = new Document({ sections: [{ children: kids }] });
    await writeFile(outPath, await Packer.toBuffer(doc));
    return;
  }

  if (r.narrative?.summary) {
    kids.push(new Paragraph({ text: 'Резюме', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    kids.push(P(r.narrative.summary));
  }

  kids.push(new Paragraph({ text: 'Сводка соответствия эталону', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  kids.push(P(`Разобрано страниц: ${r.pages.length}. Провалов критериев: ${r.counts.fail} (Critical ${r.bySeverity.Critical} · High ${r.bySeverity.High} · Medium ${r.bySeverity.Medium}), частично: ${r.counts.warn}, выполнено: ${r.counts.pass}.`, { bold: true }));
  if (r.fails.length) {
    kids.push(P('Проваленные критерии (по важности):'));
    kids.push(table(['AQC', 'Severity', 'Домен', 'Критерий', 'Стр.'], r.fails.map((f) => [f.aqc, f.severity, f.domain, f.title, String(f.pages)]), [14, 12, 20, 44, 10]));
  }

  kids.push(new Paragraph({ text: 'Постранично: факт против эталона', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
  for (const pg of r.pages) {
    kids.push(new Paragraph({ text: `${pg.kindLabel} — ${pg.url}`, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }));
    for (const s of shot(pg.screenshot)) kids.push(s);
    kids.push(P(`Соответствие голд-стандарту витрины: ${pg.score ?? '—'}%.`, { bold: true }));
    const narr = r.narrative?.perPage.find((x) => x.kind === pg.kindLabel);
    if (narr) kids.push(P(narr.text));
    kids.push(table(
      ['AQC', 'Sev', '✓', 'Критерий', 'Наблюдение', 'Эталон'],
      pg.results.map((x) => [x.aqc, x.severity, MARK[x.verdict], x.title, x.observed, x.standard]),
      [13, 9, 5, 22, 26, 25],
    ));
  }

  if (r.competitorEdge.length) {
    kids.push(new Paragraph({ text: 'Эталон рынка (где конкурент сильнее)', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    for (const e of r.competitorEdge) kids.push(P(`${e.aqc} ${e.title} — ${e.note}. У клиента критерий провален.`, { bullet: true }));
  }

  if (r.narrative?.topFixes?.length) {
    kids.push(new Paragraph({ text: 'Приоритетные правки дизайна', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    kids.push(table(['#', 'AQC', 'Sev', 'Что поправить', 'Эффект', 'PB'], r.narrative.topFixes.map((f, i) => [String(i + 1), f.aqc, f.severity, f.fix, f.effect, f.playbook]), [5, 13, 9, 34, 27, 12]));
  }

  kids.push(P('', {}));
  kids.push(P('Метод: UX-разбор ведётся по эталону композиции Commerce OS, а не оценочными суждениями. Раскрывается с доступами (session replay, heatmap, эксперименты) — структура сохраняется, уточняется уверенность.', { italics: true }));

  const doc = new Document({ sections: [{ children: kids }] });
  await writeFile(outPath, await Packer.toBuffer(doc));
}
