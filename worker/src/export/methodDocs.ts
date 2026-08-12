/**
 * .docx-экспорт method-документов: матрица зрелости (AD-16), scope по волнам,
 * причинно-следственная карта, цена в канале. Общий табличный стиль.
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { MaturityReport } from '../maturity.js';
import { levelLabel } from '../maturity.js';
import type { ScopeReport } from '../routing.js';
import type { CausalMap } from '../causal.js';
import type { PriceChannelReport } from '../pricechannel.js';
import type { Synthesis } from '../synthesis.js';
import type { Kp } from '../kp.js';
import type { MoneyResult } from '../money.js';

const LIME = 'A9D92F';
const INK = '12160A';
const P = (text: string, o: { bold?: boolean; italics?: boolean } = {}) =>
  new Paragraph({ children: [new TextRun({ text, bold: o.bold, italics: o.italics })], spacing: { after: 80 } });
const H = (text: string, lvl: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
  new Paragraph({ text, heading: lvl, spacing: { before: 200, after: 100 } });
const cell = (text: string, o: { head?: boolean; w?: number } = {}) =>
  new TableCell({ width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined, shading: o.head ? { fill: LIME } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text, bold: o.head, color: o.head ? INK : undefined })] })] });
const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9DEE6' };
const table = (head: string[], rows: string[][], widths?: number[]) =>
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths?.[i] })) }), ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths?.[i] })) }))] });
const save = async (kids: (Paragraph | Table)[], out: string) => writeFile(out, await Packer.toBuffer(new Document({ sections: [{ children: kids }] })));
const meta = (ds: AuditDataset, sub: string) => P(`${ds.client.finalUrl || ds.client.rootUrl} · Commerce OS · ${sub} · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true });

export async function exportMaturityDocx(ds: AuditDataset, r: MaturityReport, out: string): Promise<void> {
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Матрица зрелости (AD-16)', heading: HeadingLevel.TITLE }), meta(ds, '18 доменов · L1→L5 · внешний обход витрины')];
  k.push(P(`Средний уровень по наблюдаемым доменам: ${r.observedAvg ?? '—'}/5. Полная матрица заполняется ответами опросника и доступами.`, { bold: true }));
  k.push(table(['Домен', 'Что оценивается', 'Уровень', 'Основание'], r.rows.map((d) => [d.domain, d.assesses, levelLabel(d.level), d.basis]), [16, 40, 20, 24]));
  k.push(P('L1 Хаос → L2 Повторяемо → L3 Определено → L4 Управляемо → L5 Оптимизировано.', { italics: true }));
  await save(k, out);
}

export async function exportScopeDocx(ds: AuditDataset, r: ScopeReport, out: string): Promise<void> {
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Scope программы по волнам', heading: HeadingLevel.TITLE }), meta(ds, 'роутинг разрывов в плейбуки · внешний обход витрины')];
  k.push(P('Каждый плейбук активирован основанием (наблюдение с адресом/цифрой). Волны: тактика 0–3 → ядро 3–6 → стратегия 6–12 мес.', { italics: true }));
  if (!r.waves.length) k.push(P('Активаций не набрано — витрина близка к стандарту по наблюдаемым сигналам.'));
  for (const w of r.waves) { k.push(H(w.title)); k.push(table(['Плейбук', 'Методика', 'Основание'], w.items.map((i) => [i.playbook, i.name, i.reasons.join('; ')]), [14, 34, 52])); }
  if (r.notIncluded.length) { k.push(H('Осознанно НЕ в scope (нет основания во внешнем аудите)')); for (const n of r.notIncluded) k.push(P(`• ${n}`)); }
  await save(k, out);
}

export async function exportCausalDocx(ds: AuditDataset, r: CausalMap, out: string): Promise<void> {
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Причинно-следственная карта', heading: HeadingLevel.TITLE }), meta(ds, 'симптом → причина → деньги · внешний обход витрины')];
  k.push(P(r.moneyNote));
  if (!r.nodes.length) k.push(P('Причинных узлов не выделено на текущих данных.'));
  r.nodes.forEach((n, i) => {
    k.push(H(`Узел ${i + 1}. Корневая причина: ${n.rootCause}`, HeadingLevel.HEADING_2));
    if (n.symptoms.length) k.push(P(`Симптомы: ${n.symptoms.join('; ')}`));
    if (n.evidence.length) k.push(P(`Доказательство (обход): ${n.evidence.join('; ')}`));
    k.push(P(`Деньги: ${n.moneyLink}`, { bold: true }));
  });
  k.push(P('Плейбук адресует корневую причину. Симптом без причины в roadmap не попадает.', { italics: true }));
  await save(k, out);
}

const rubK = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;
const WAVE_W: Record<number, string> = { 1: '0–3 мес', 2: '3–6 мес', 3: '6–12 мес' };
export async function exportKpDocx(ds: AuditDataset, kp: Kp, money: MoneyResult | null, scope: ScopeReport | null, out: string): Promise<void> {
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Коммерческое предложение', heading: HeadingLevel.TITLE }), meta(ds, 'на основе аудита · внешний обход витрины')];
  k.push(H('Для кого')); k.push(P(kp.forClient));
  k.push(H('Методика')); k.push(P(kp.method, { italics: true }));
  if (kp.pains.length) { k.push(H('Боли (по причине)')); for (const x of kp.pains) k.push(P(`• ${x}`)); }
  k.push(H('Цена бездействия'));
  k.push(P(money ? `Недополученный оборот ≈ ${rubK(money.potentialYear)}/год (консервативно ${rubK(money.consMinYear)}–${rubK(money.consMaxYear)}). Каждый месяц промедления — упущенный оборот.` : 'Считается после передачи доступов (нужны трафик, конверсия, чек). Во внешнем аудите разрывы против эталона уже видны.', { bold: Boolean(money) }));
  k.push(H('Точка Б')); k.push(P(kp.pointB));
  if (scope?.waves?.length) {
    k.push(H('Программа по волнам'));
    k.push(table(['Волна', 'Срок', 'Что делаем'], scope.waves.map((w) => [String(w.n), WAVE_W[w.n] ?? '', w.items.map((i) => `${i.playbook} ${i.name}`).join('; ')]), [10, 14, 76]));
  }
  k.push(H('Как измеряем результат')); k.push(P(kp.howMeasure));
  k.push(H('Бюджет')); k.push(P('Собирается из cost_base (капитальные разовые + операционные ретейнеры), с разделением на стоимость запуска и месячную нагрузку. Заполняется по подтверждённым ставкам.', { italics: true }));
  if (kp.scenarios.length) { k.push(H('Сценарии')); for (const s of kp.scenarios) k.push(P(`• ${s.name} — ${s.desc}`)); }
  if (kp.nextSteps.length) { k.push(H('Следующие шаги')); kp.nextSteps.forEach((s, i) => k.push(P(`${i + 1}. ${s}`))); }
  await save(k, out);
}

export async function exportSynthesisDocx(ds: AuditDataset, s: Synthesis, out: string): Promise<void> {
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Синтез аудита', heading: HeadingLevel.TITLE }), meta(ds, 'взаимосвязи всех линз · внешний обход витрины')];
  k.push(P(s.headline, { bold: true }));
  if (s.crossLinks.length) {
    k.push(H('Взаимосвязи (компаундные эффекты)'));
    k.push(table(['Линза A', 'Линза B', 'Эффект'], s.crossLinks.map((c) => [c.a, c.b, c.effect]), [22, 22, 56]));
  }
  if (s.rootCauses.length) {
    k.push(H('Единые корневые причины'));
    k.push(table(['Корневая причина', 'Из линз', 'Эффект'], s.rootCauses.map((r) => [r.cause, r.from.join(', '), r.impact]), [34, 26, 40]));
  }
  if (s.priorities.length) {
    k.push(H('Сквозные приоритеты'));
    s.priorities.forEach((p, i) => k.push(P(`${i + 1}. ${p.title} — ${p.why}`)));
  }
  k.push(P(s.oneLine, { italics: true }));
  await save(k, out);
}

export async function exportPriceChannelDocx(ds: AuditDataset, r: PriceChannelReport, out: string): Promise<void> {
  const label: Record<string, string> = { producer: 'Производитель / владелец бренда', reseller: 'Реселлер чужих брендов', hybrid: 'Гибрид', unknown: 'Требует уточнения' };
  const k: (Paragraph | Table)[] = [new Paragraph({ text: 'Цена в канале и роль в цепочке', heading: HeadingLevel.TITLE }), meta(ds, 'внешний обход витрины')];
  k.push(P(`Роль клиента (гипотеза): ${label[r.role]}. ${r.roleBasis}.`, { bold: true }));
  k.push(P(r.risk, { italics: true }));
  k.push(H('Протокол проверки цены в канале'));
  k.push(table(['Что проверить', 'Как', 'Статус'], r.checklist.map((c) => [c.item, c.how, c.status]), [34, 46, 20]));
  await save(k, out);
}
