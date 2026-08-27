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
    ? `Загальний недоотриманий оборот ≈ ${rub(money.potentialYear)}/рік (ланцюгова атрибуція). Гроші розподіляються по вузлах через важелі воронки — не додавати розриви напряму.`
    : 'Гроші рахуються за наявності базових показників (трафік, конверсія, середній чек). Без них — якісний зв\'язок причини з наслідком.';

  const topLever = money ? [...money.waterfall].sort((x, y) => y.contribYear - x.contribYear)[0] : null;

  const nodes: CausalNode[] = (a?.pains ?? []).map((p) => ({
    rootCause: p.cause,
    symptoms: p.symptoms ?? [],
    evidence: p.evidence ?? [],
    moneyLink: money && topLever ? `пов'язано з воронкою (найбільший важіль: ${topLever.label} ≈ ${rub(topLever.contribYear)}/рік)` : 'ефект в обороті — оцінюється за наявності базових даних',
  }));

  // Если болей нет, но есть находки-гипотезы — свернуть их в причины по видам.
  if (!nodes.length && a?.findings.length) {
    const byArea = new Map<string, string[]>();
    for (const f of a.findings) { const arr = byArea.get(f.area) ?? []; arr.push(f.fact); byArea.set(f.area, arr); }
    for (const [area, facts] of byArea) nodes.push({ rootCause: `Системна слабина: ${area}`, symptoms: facts, evidence: [], moneyLink: 'ефект в обороті — оцінюється за наявності базових даних' });
  }

  // Детерминированное достраивание: карта пополняется из системных дефектов и
  // CI-цепочек даже без аналитического слоя (и в дополнение к нему — до 7 узлов).
  const have = new Set(nodes.map((x) => x.rootCause.toLowerCase()));
  const push = (x: CausalNode) => { if (!have.has(x.rootCause.toLowerCase()) && nodes.length < 7) { nodes.push(x); have.add(x.rootCause.toLowerCase()); } };
  const sys = det?.systemic ?? [];
  if (sys.length >= 2) push({
    rootCause: 'Шаблони вітрини не доведені до еталона (дефекти рівня шаблону)',
    symptoms: sys.map((s) => s.title),
    evidence: ['проявляються на всіх розібраних сторінках — отже, живуть у шаблоні, а не на сторінці'],
    moneyLink: money ? 'входить у загальний недоотриманий оборот (див. економіку)' : 'ефект в обороті — оцінюється за наявності базових даних',
  });
  for (const c of det?.chains ?? []) push({
    rootCause: c.implies,
    symptoms: [c.observed],
    evidence: ['спостереження зовнішнього обходу'],
    moneyLink: 'ефект в обороті — оцінюється за наявності базових даних',
  });

  // Связь с единым реестром находок: каждому узлу — ID находок по текстовому
  // пересечению; если у связанных находок есть деньги, узел получает реальную
  // сумму revenue exposure (а не общий ориентир воронки).
  const findings = det?.findings ?? [];
  if (findings.length) {
    const linksOf = (node: CausalNode) => {
      const hay = `${node.rootCause} ${node.symptoms.join(' ')}`.toLowerCase();
      return findings.filter((f) => {
        const words = f.title.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter((w) => w.length >= 5);
        return words.some((w) => hay.includes(w)) || Boolean(f.funnelStep && hay.includes(f.funnelStep));
      });
    };

    /*
     * Одна находка цепляется к нескольким узлам — и раньше КАЖДЫЙ забирал её
     * сумму целиком. Три узла про каталог при одной находке на 300 000 заявляли
     * 900 000 при общем потенциале 600 000: читатель, складывающий числа по
     * карте, получал больше, чем весь недополученный оборот аудита. Ровно от
     * этого предостерегает сноска самой карты — «не додавати розриви напряму».
     *
     * Делим долями: сумма по узлам теперь не превышает суммы по находкам, как и
     * в цепочной атрибуции money.ts, где вклады не дублируются, а делятся.
     */
    const shareCount = new Map<string, number>();
    const perNode = nodes.map((n) => linksOf(n));
    for (const linked of perNode) for (const f of linked) shareCount.set(f.id, (shareCount.get(f.id) ?? 0) + 1);

    nodes.forEach((node, i) => {
      // Режем до восьми ДО подсчёта денег: иначе сумма приходила от находок,
      // которых в списке нет, и её нечем было проверить.
      const linked = perNode[i].slice(0, 8);
      if (!linked.length) return;
      node.findingIds = linked.map((f) => f.id);
      const rev = linked.reduce((s, f) => s + f.revenueExposure / (shareCount.get(f.id) || 1), 0);
      const shared = linked.some((f) => (shareCount.get(f.id) ?? 1) > 1);
      if (rev > 0) node.moneyLink = `≈ ${rub(Math.round(rev))}/рік за пов'язаними знахідками (${node.findingIds.slice(0, 4).join(', ')}${node.findingIds.length > 4 ? '…' : ''})`
        + (shared ? ' — частка спільних знахідок, суми вузлів не складаються' : '');
    });
  }

  return { nodes, moneyNote };
}

export function renderCausalMd(ds: AuditDataset, r: CausalMap): string {
  const out: string[] = [];
  out.push(`# Причинно-наслідкова карта — ${ds.client.finalUrl || ds.client.rootUrl}`);
  out.push(`_Симптом → корінна причина → гроші_`);
  out.push('');
  out.push(r.moneyNote);
  out.push('');
  if (!r.nodes.length) { out.push('> Причинних вузлів не виділено на поточних даних.'); return out.join('\n'); }
  out.push('Працюємо з корінною причиною, а не з симптомом. Гроші — один раз на вузол.');
  out.push('');
  r.nodes.forEach((n, i) => {
    out.push(`## Вузол ${i + 1}. Корінна причина: ${n.rootCause}`);
    if (n.symptoms.length) out.push(`**Симптоми:** ${n.symptoms.join('; ')}`);
    if (n.evidence.length) out.push(`**Доказ (обхід):** ${n.evidence.join('; ')}`);
    if (n.findingIds?.length) out.push(`**Знахідки реєстру:** ${n.findingIds.join(', ')}`);
    out.push(`**Гроші:** ${n.moneyLink}`);
    out.push('');
  });
  out.push('---');
  out.push('_Плейбук адресує корінну причину. Симптом без причини в дорожню карту не потрапляє._');
  return out.join('\n');
}
