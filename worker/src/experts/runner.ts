/**
 * Раннер премиум-экспертизы: запускает агентов каталога (или выбранное подмножество),
 * собирает их находки и перепроверки. Ошибка/недоступность одного агента не роняет
 * прогон — фиксируется как skip с причиной.
 */
import { EXPERT_CATALOG } from './catalog.js';
import { withTimeout } from '../util/timeout.js';
import type { ExpertContext, ExpertResult } from './types.js';

// Пер-експерт таймаут: один завислий агент не має вішати всю преміум-хвилю
// (вони йдуть послідовно). Перевищив — фіксуємо skip і йдемо далі.
const EXPERT_TIMEOUT_MS = Number(process.env.EXPERT_TIMEOUT_MS) || 240000;

export async function runExperts(ctx: ExpertContext, opts: { only?: string[]; deadline?: () => boolean } = {}): Promise<ExpertResult[]> {
  const experts = opts.only?.length ? EXPERT_CATALOG.filter((e) => opts.only!.includes(e.card.id)) : EXPERT_CATALOG;
  const results: ExpertResult[] = [];
  for (const e of experts) {
    const skip = (reason: string): ExpertResult => ({ expertId: e.card.id, name: e.card.name, domain: e.card.domain, ran: false, skippedReason: reason, findings: [], verifications: [], summary: reason });
    if (opts.deadline?.()) { results.push(skip('пропущено: ліміт часу прогону')); continue; }
    try {
      results.push(await withTimeout(e.run(ctx), EXPERT_TIMEOUT_MS, `эксперт ${e.card.id}`));
    } catch (err) {
      results.push(skip(`ошибка: ${String(err).slice(0, 80)}`));
    }
  }
  return results;
}
