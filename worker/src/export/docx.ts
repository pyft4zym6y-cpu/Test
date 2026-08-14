/**
 * Экспорт аудит-отчёта в .docx: резюме, точка А, находки, боли по причинам,
 * конкуренты, узкие места из обхода, открытые вопросы. Сопроводительный документ
 * к презентации AD-15. Всё с меткой L0 (наблюдение, не факт по данным клиента).
 */
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { writeFile } from 'node:fs/promises';
import type { AuditDataset } from '../report.js';
import type { Analysis } from '../analyze.js';
import type { EngineResult } from '../portalEngine.js';
import type { MoneyResult } from '../money.js';
import { clientName } from '../deliverables.js';

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

const P = (text: string, opts: { bold?: boolean; italics?: boolean; bullet?: boolean } = {}) =>
  new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })],
    ...(opts.bullet ? { bullet: { level: 0 } } : {}),
    spacing: { after: 80 },
  });

const H = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({ text, heading: level, spacing: { before: 200, after: 100 } });

function clientScore(ds: AuditDataset): number | null {
  const scored = ds.client.pages.filter((p) => p.score !== null);
  return scored.length ? Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length) : null;
}

export async function exportReportDocx(ds: AuditDataset, a: Analysis, engine: EngineResult | null, money: MoneyResult | null, outPath: string): Promise<void> {
  const cs = clientScore(ds);
  const kids: Paragraph[] = [];

  kids.push(new Paragraph({ text: `Аудит ${clientName(ds)} — внешний обход витрины без доступов`, heading: HeadingLevel.TITLE }));
  kids.push(P(`Commerce OS · внешний обход витрины без доступов · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`, { italics: true }));
  kids.push(P('Все оценки — «наблюдение внешнего обхода», порядок величины, не факт по данным клиента. Деньги считаются после передачи доступов.', { italics: true }));

  kids.push(H('Резюме для собственника', HeadingLevel.HEADING_1));
  kids.push(P(a.summary || '—'));

  kids.push(H('Точка А — состояние по обходу', HeadingLevel.HEADING_1));
  kids.push(P(`Соответствие витрины голд-стандарту: ${cs ?? '—'}% (по ${ds.client.pages.filter((p) => p.score !== null).length} страницам).`, { bold: true }));
  kids.push(P(`Платформа: ${ds.client.tech.platform ?? 'не определена'}. Аналитика: ${ds.client.tech.analytics.join(', ') || 'не обнаружена'}. robots.txt: ${ds.client.robotsTxt ? 'есть' : 'нет'}, sitemap.xml: ${ds.client.sitemapXml ? 'есть' : 'нет'}.`));
  if (a.healthNote) kids.push(P(a.healthNote));

  if (engine) {
    kids.push(H('Расчёт движка Commerce OS', HeadingLevel.HEADING_1));
    kids.push(P(engine.score != null
      ? `Health Score: ${engine.score}/100 — «${engine.band}». Рекомендация метода: ${engine.action}. (зрелость A ${engine.scoreA ?? '—'}, разрывы B ${engine.scoreB ?? '—'}). Заполнено ${engine.coverage.answered}/${engine.coverage.total}.`
      : `Health Score пока не считается: заполнено ${engine.coverage.answered}/${engine.coverage.total} ответов опросника (нужно больше). Это ожидаемо на раннем тире.`, { bold: engine.score != null }));
    if (engine.gaps.length) {
      kids.push(P('Критические разрывы (штраф к Health Score):', { bold: true }));
      for (const g of engine.gaps) kids.push(P(`${g.label} (−${g.penalty}) — ${g.evidence}`, { bullet: true }));
    }
    if (engine.decisions.length) {
      kids.push(P('Приоритетные решения (влияние/сложность, с трассой «почему»):', { bold: true }));
      for (const d of engine.decisions.slice(0, 8)) kids.push(P(`${d.id} ${d.title} — impact ${d.impact}/сложность ${d.difficulty}, ~${d.timeDays} дн, ROI ${d.roi}, плейбуки: ${d.playbooks.join(', ')}. Почему: ${d.why.join('; ')}`, { bullet: true }));
    }
  }

  if (money) {
    kids.push(H('Недополученный оборот (цепная атрибуция)', HeadingLevel.HEADING_1));
    kids.push(P(`Выручка сейчас: ${rub(money.currentMonth)}/мес → при целевой воронке: ${rub(money.targetMonth)}/мес.`));
    kids.push(P(`Недополученный оборот: ${rub(money.potentialMonth)}/мес ≈ ${rub(money.potentialYear)}/год (существующая воронка).`, { bold: true }));
    if (money.extraYear) kids.push(P(`Новые потоки (МП/ЕС): +${rub(money.extraYear)}/год.`));
    kids.push(P(`Консервативно: ${rub(money.consMinYear)}–${rub(money.consMaxYear)}/год. Прогноз 12 мес: ${rub(money.forecast.current)} → ${rub(money.forecast.withProgram)} (+${money.forecast.upliftPct}%).`));
    kids.push(P('Вклад рычагов воронки (₴/год) — считаны цепной атрибуцией, не складываются напрямую:', { bold: true }));
    for (const w of [...money.waterfall].sort((x, y) => y.contribYear - x.contribYear)) kids.push(P(`${w.label}: ${rub(w.contribYear)} (${w.fact} → ${w.target})`, { bullet: true }));
    if (!money.invariantOk) kids.push(P('⚠️ Инвариант Σ вкладов = потенциал нарушен — проверьте baseline.', { italics: true }));
  }

  if (a.findings.length) {
    kids.push(H('Находки по видам', HeadingLevel.HEADING_1));
    for (const f of a.findings) kids.push(P(`[${f.area} · ${f.status}] ${f.fact} — ${f.why} (уверенность ${f.confidence})`, { bullet: true }));
  }

  if (a.pains.length) {
    kids.push(H('Реестр болей (по причинам)', HeadingLevel.HEADING_1));
    for (const p of a.pains) {
      kids.push(P(`Причина: ${p.cause}`, { bold: true }));
      if (p.symptoms?.length) kids.push(P(`Симптомы: ${p.symptoms.join('; ')}`, { bullet: true }));
      if (p.evidence?.length) kids.push(P(`Доказательство (обход): ${p.evidence.join('; ')}`, { bullet: true }));
    }
  }

  if (ds.competitors.length && a.competitors) {
    kids.push(H('Конкурентное поле', HeadingLevel.HEADING_1));
    kids.push(P(a.competitors));
  }

  kids.push(H('Узкие места (голд-стандарт)', HeadingLevel.HEADING_1));
  const fails = new Map<string, number>();
  for (const pg of ds.client.pages) for (const c of pg.checks) if (!c.pass) fails.set(`[${c.group}] ${c.label}`, (fails.get(`[${c.group}] ${c.label}`) ?? 0) + 1);
  const top = Array.from(fails.entries()).sort((x, y) => y[1] - x[1]).slice(0, 15);
  if (top.length) for (const [k, n] of top) kids.push(P(`${k} — на ${n} стр.`, { bullet: true }));
  else kids.push(P('Критичных провалов не зафиксировано на разобранных страницах.'));

  kids.push(H('Открытые вопросы и запрос доступов (для L1)', HeadingLevel.HEADING_1));
  for (const q of a.openQuestions.length ? a.openQuestions : ['Доступ к GA4', 'Выгрузка заказов за 6–12 мес', 'Доступ к CRM и рекламным кабинетам']) kids.push(P(q, { bullet: true }));

  if (a.missingFacts.length) {
    kids.push(H('Недостающие факты (добор из внешних источников)', HeadingLevel.HEADING_1));
    for (const m of a.missingFacts) kids.push(P(m, { bullet: true }));
  }

  const doc = new Document({ sections: [{ children: kids }] });
  const buf = await Packer.toBuffer(doc);
  await writeFile(outPath, buf);
}
