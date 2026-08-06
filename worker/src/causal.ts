/**
 * Причинно-следственная карта. Инновация метода: симптом → корневая причина →
 * деньги. Плейбук получает корневая причина, а не симптом; деньги считаются один
 * раз на узел. Строится из реестра болей анализа (боли уже сгруппированы по
 * причине) + денежный ориентир из модели, если он есть.
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';
import type { MoneyResult } from './money.js';

export type CausalNode = { rootCause: string; symptoms: string[]; evidence: string[]; moneyLink: string };
export type CausalMap = { nodes: CausalNode[]; moneyNote: string };

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

export function buildCausal(a: Analysis, money: MoneyResult | null): CausalMap {
  const moneyNote = money
    ? `Общий недополученный оборот ≈ ${rub(money.potentialYear)}/год (цепная атрибуция). Деньги распределяются по узлам через рычаги воронки — не складывать разрывы напрямую.`
    : 'Деньги считаются на слое L1 (нужны трафик, конверсия, чек). На L0 — качественная связь причины с эффектом.';

  const topLever = money ? [...money.waterfall].sort((x, y) => y.contribYear - x.contribYear)[0] : null;

  const nodes: CausalNode[] = a.pains.map((p) => ({
    rootCause: p.cause,
    symptoms: p.symptoms ?? [],
    evidence: p.evidence ?? [],
    moneyLink: money && topLever ? `связано с воронкой (крупнейший рычаг: ${topLever.label} ≈ ${rub(topLever.contribYear)}/год)` : 'эффект в обороте — оценивается на L1',
  }));

  // Если болей нет, но есть находки-гипотезы — свернуть их в причины по видам.
  if (!nodes.length && a.findings.length) {
    const byArea = new Map<string, string[]>();
    for (const f of a.findings) { const arr = byArea.get(f.area) ?? []; arr.push(f.fact); byArea.set(f.area, arr); }
    for (const [area, facts] of byArea) nodes.push({ rootCause: `Системная слабина: ${area}`, symptoms: facts, evidence: [], moneyLink: 'эффект в обороте — оценивается на L1' });
  }

  return { nodes, moneyNote };
}

export function renderCausalMd(ds: AuditDataset, r: CausalMap): string {
  const out: string[] = [];
  out.push(`# Причинно-следственная карта — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Commerce OS · симптом → корневая причина → деньги · слой L0 · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}_`);
  out.push('');
  out.push(r.moneyNote);
  out.push('');
  if (!r.nodes.length) { out.push('> Причинных узлов не выделено на текущих данных.'); return out.join('\n'); }
  out.push('Работаем с корневой причиной, а не с симптомом. Деньги — один раз на узел.');
  out.push('');
  r.nodes.forEach((n, i) => {
    out.push(`## Узел ${i + 1}. Корневая причина: ${n.rootCause}`);
    if (n.symptoms.length) out.push(`**Симптомы:** ${n.symptoms.join('; ')}`);
    if (n.evidence.length) out.push(`**Доказательство (обход):** ${n.evidence.join('; ')}`);
    out.push(`**Деньги:** ${n.moneyLink}`);
    out.push('');
  });
  out.push('---');
  out.push('_Плейбук адресует корневую причину. Симптом без причины в roadmap не попадает._');
  return out.join('\n');
}
