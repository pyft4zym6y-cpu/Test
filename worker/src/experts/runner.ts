/**
 * Раннер премиум-экспертизы: запускает агентов каталога (или выбранное подмножество),
 * собирает их находки и перепроверки. Ошибка/недоступность одного агента не роняет
 * прогон — фиксируется как skip с причиной.
 */
import { EXPERT_CATALOG } from './catalog.js';
import type { ExpertContext, ExpertResult } from './types.js';

export async function runExperts(ctx: ExpertContext, opts: { only?: string[] } = {}): Promise<ExpertResult[]> {
  const experts = opts.only?.length ? EXPERT_CATALOG.filter((e) => opts.only!.includes(e.card.id)) : EXPERT_CATALOG;
  const results: ExpertResult[] = [];
  for (const e of experts) {
    try {
      results.push(await e.run(ctx));
    } catch (err) {
      results.push({ expertId: e.card.id, name: e.card.name, domain: e.card.domain, ran: false, skippedReason: `ошибка: ${String(err).slice(0, 80)}`, findings: [], verifications: [], summary: 'ошибка' });
    }
  }
  return results;
}
