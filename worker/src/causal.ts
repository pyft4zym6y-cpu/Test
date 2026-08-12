/**
 * Причинно-следственная карта. Инновация метода: симптом → корневая причина →
 * деньги. Плейбук получает корневая причина, а не симптом; деньги считаются один
 * раз на узел. Строится из реестра болей анализа (боли уже сгруппированы по
 * причине) + денежный ориентир из модели, если он есть.
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';
import type { MoneyResult } from './money.js';
import type { Finding } from './registry.js';

export type CausalNode = { rootCause: string; symptoms: string[]; evidence: string[]; moneyLink: string; findingIds?: string[] };
export type CausalMap = { nodes: CausalNode[]; moneyNote: string };

const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₴`;

/** Детерминированный источник узлов, когда аналитический слой (Claude) недоступен:
 *  системные дефекты UX/UI + цепочки Commerce Intelligence сворачиваются в
 *  причинные узлы. Карта не должна оставаться пустой из-за баланса API. */
export type DetSources = {
  systemic?: { title: string; detail: string }[];
  chains?: { observed: string; implies: string; action: string }[];
  findings?: Finding[];   // единый реестр — узлы связываются с ID находок и их деньгами
};

export function buildCausal(a: Analysis | null, money: MoneyResult | null, det?: DetSources): CausalMap {
  const moneyNote = money
    ? `Общий недополученный оборот ≈ ${rub(money.potentialYear)}/год (цепная атрибуция). Деньги распределяются по узлам через рычаги воронки — не складывать разрывы напрямую.`
    : 'Деньги считаются на слое L1 (нужны трафик, конверсия, чек). На L0 — качественная связь причины с эффектом.';

  const topLever = money ? [...money.waterfall].sort((x, y) => y.contribYear - x.contribYear)[0] : null;

  const nodes: CausalNode[] = (a?.pains ?? []).map((p) => ({
    rootCause: p.cause,
    symptoms: p.symptoms ?? [],
    evidence: p.evidence ?? [],
    moneyLink: money && topLever ? `связано с воронкой (крупнейший рычаг: ${topLever.label} ≈ ${rub(topLever.contribYear)}/год)` : 'эффект в обороте — оценивается на L1',
  }));

  // Если болей нет, но есть находки-гипотезы — свернуть их в причины по видам.
  if (!nodes.length && a?.findings.length) {
    const byArea = new Map<string, string[]>();
    for (const f of a.findings) { const arr = byArea.get(f.area) ?? []; arr.push(f.fact); byArea.set(f.area, arr); }
    for (const [area, facts] of byArea) nodes.push({ rootCause: `Системная слабина: ${area}`, symptoms: facts, evidence: [], moneyLink: 'эффект в обороте — оценивается на L1' });
  }

  // Детерминированное достраивание: карта пополняется из системных дефектов и
  // CI-цепочек даже без аналитического слоя (и в дополнение к нему — до 7 узлов).
  const have = new Set(nodes.map((x) => x.rootCause.toLowerCase()));
  const push = (x: CausalNode) => { if (!have.has(x.rootCause.toLowerCase()) && nodes.length < 7) { nodes.push(x); have.add(x.rootCause.toLowerCase()); } };
  const sys = det?.systemic ?? [];
  if (sys.length >= 2) push({
    rootCause: 'Шаблоны витрины не доведены до эталона (дефекты уровня шаблона)',
    symptoms: sys.map((s) => s.title),
    evidence: ['проявляются на всех разобранных страницах — значит, живут в шаблоне, а не на странице'],
    moneyLink: money ? 'входит в общий недополученный оборот (см. экономику)' : 'эффект в обороте — оценивается на L1',
  });
  for (const c of det?.chains ?? []) push({
    rootCause: c.implies,
    symptoms: [c.observed],
    evidence: ['наблюдение внешнего обхода'],
    moneyLink: 'эффект в обороте — оценивается на L1',
  });

  // Связь с единым реестром находок: каждому узлу — ID находок по текстовому
  // пересечению; если у связанных находок есть деньги, узел получает реальную
  // сумму revenue exposure (а не общий ориентир воронки).
  const findings = det?.findings ?? [];
  if (findings.length) {
    for (const node of nodes) {
      const hay = `${node.rootCause} ${node.symptoms.join(' ')}`.toLowerCase();
      const linked = findings.filter((f) => {
        const words = f.title.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter((w) => w.length >= 5);
        return words.some((w) => hay.includes(w)) || Boolean(f.funnelStep && hay.includes(f.funnelStep));
      });
      if (!linked.length) continue;
      node.findingIds = linked.map((f) => f.id).slice(0, 8);
      const rev = linked.reduce((s, f) => s + f.revenueExposure, 0);
      if (rev > 0) node.moneyLink = `≈ ${rub(rev)}/год по связанным находкам (${node.findingIds.slice(0, 4).join(', ')}${node.findingIds.length > 4 ? '…' : ''})`;
    }
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
    if (n.findingIds?.length) out.push(`**Находки реестра:** ${n.findingIds.join(', ')}`);
    out.push(`**Деньги:** ${n.moneyLink}`);
    out.push('');
  });
  out.push('---');
  out.push('_Плейбук адресует корневую причину. Симптом без причины в roadmap не попадает._');
  return out.join('\n');
}
