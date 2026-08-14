/**
 * Блок Б: ресёрч целевого состояния. По нише клиента и его пробелам Claude с
 * web_search собирает СОВРЕМЕННЫЕ тренды ecommerce, ходы конкурентов и
 * ниша-специфичные бенчмарки конверсии. Питает раздел «як треба» презентации —
 * не абстрактный эталон, а обоснованный research («вот каким должен быть сайт»).
 * Без ключа/поиска — null, презентация обходится эталоном.
 */
import { webResearch } from './externalAudits.js';

export type TargetStateResearch = {
  trends: string[];            // современные приёмы (UGC, видео в карточке, AI-подбор, живой поиск…)
  competitorMoves: string[];   // что делают сильные игроки ниши
  benchmark: { niche: string; typical: string; strong: string }; // конверсия по нише
  sources?: string[];
};

const SYSTEM = `Ти — стратег ecommerce рівня C-level. Тобі дають нішу магазину, платформу і головні прогалини вітрини. Завдання — за web-пошуком зібрати ОБҐРУНТОВАНЕ цільове бачення: як має виглядати сильна вітрина цієї ніші у 2025–2026.

Правила:
- Спирайся на реальні сучасні практики й гравців ніші, знайдені пошуком. Не вигадуй цифри — бенчмарки давай діапазонами з джерел.
- Тренди — конкретні прийоми (UGC-контент, відео в картці, AI-підбір/quiz, живий пошук, порівняння, розстрочка, соц-доказ), а не загальні слова.
- Українською.

Поверни СТРОГО JSON:
{
  "trends": ["6-8 конкретних сучасних прийомів вітрини цієї ніші"],
  "competitorMoves": ["4-6 ходів, які роблять сильні гравці ніші"],
  "benchmark": {"niche":"назва ніші","typical":"типова конверсія слабкої вітрини, діапазон %","strong":"конверсія сильної вітрини, діапазон %"},
  "sources": ["домени джерел"]
}`;

/** Ресёрч целевого состояния по нише. gaps — краткий список ключевых пробелов. */
export async function researchTargetState(niche: string, gaps: string[], platform: string | null, log?: (m: string) => void): Promise<TargetStateResearch | null> {
  const user = `Ніша магазину: ${niche}. Платформа: ${platform ?? 'невідома'}. Головні прогалини вітрини: ${gaps.slice(0, 8).join('; ') || 'типові для раннього магазину'}.\n\nЗбери цільове бачення (тренди, ходи конкурентів, бенчмарк конверсії ніші) і поверни JSON.`;
  try {
    const r = await webResearch<TargetStateResearch>(SYSTEM, user, log);
    if (!r || !Array.isArray(r.trends) || !r.trends.length) return null;
    log?.(`✓ ресёрч цільового стану: трендів ${r.trends.length}, ходів конкурентів ${r.competitorMoves?.length ?? 0}`);
    return { trends: r.trends, competitorMoves: r.competitorMoves ?? [], benchmark: r.benchmark ?? { niche, typical: '0.2–0.8%', strong: '3–5%' }, sources: r.sources };
  } catch (e) {
    log?.(`⚠️ ресёрч цільового стану не відпрацював (${String(e).slice(0, 80)})`);
    return null;
  }
}
