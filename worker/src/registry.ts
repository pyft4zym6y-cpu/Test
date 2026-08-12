/**
 * ЕДИНЫЙ РЕЕСТР НАХОДОК (Finding Registry) — ядро «единой диагностической машины».
 *
 * Проблема, которую решает: раньше каждый отчёт (UX/UI, каналы, отзывы, journey,
 * механики, зрелость…) лепил свои «тонкие» находки без ID и без общего скоринга,
 * поэтому документы не связывались в систему, а одна и та же проблема (напр. чекаут)
 * жила в пяти отчётах пятью формулировками с разными приоритетами.
 *
 * Реестр даёт КАЖДОЙ находке:
 *  - стабильный ID (`domain-os-NNN`), общий для всех отчётов;
 *  - детерминированную УВЕРЕННОСТЬ = Evidence × Reproducibility × Source × Coverage
 *    (не «экспертное число», а произведение измеримых факторов);
 *  - IMPACT × CONFIDENCE;
 *  - REVENUE EXPOSURE — деньги, которых касается находка (атрибуция из денежной
 *    модели money.ts по шагу воронки, взвешенно; Σ по шагу = вклад рычага);
 *  - PRIORITY = Impact × Confidence × RevenueExposure / Cost и полосу P0/P1/P2;
 *  - слой доказательств (URL/скриншот/DOM/тест/таймстемп) и источник/воспроизводимость.
 *
 * Все отчёты ПИШУТ сюда FindingInput; беклог/причинная карта/охват/exec-диагностика
 * ЧИТАЮТ отсюда единый scored-список. Ничего не зависит от Claude — чистая арифметика.
 */
import type { MoneyResult, LeverKey } from './money.js';

/** Уровень доказательства (E1 слабейший … E4 сильнейший). */
export type EvidenceLevel = 'E1' | 'E2' | 'E3' | 'E4';
/** Источник наблюдения/сбоя — чтобы таймаут теста не выдавался за дефект сайта. */
export type FindingSource = 'сайт' | 'данные' | 'браузер/тест' | 'сеть' | 'внешний-поиск' | 'unknown';
/** Шаг воронки — связывает находку с деньгами и с причинной картой. */
export type FunnelStep =
  | 'привлечение' | 'каталог' | 'карточка' | 'корзина' | 'чекаут' | 'оплата'
  | 'доставка' | 'retention' | 'доверие' | 'аналитика' | 'право' | 'сквозной';
export type Priority = 'P0' | 'P1' | 'P2';
export type CoverageStatus = 'covered' | 'partial' | 'external' | 'needs-access';

/** Слой доказательств: где именно зафиксирована находка (Evidence Registry). */
export type EvidenceRef = {
  url?: string; screenshot?: boolean; dom?: string; test?: string;
  timestamp?: string; note?: string;
};

/** То, что отчёт-источник кладёт в реестр (сырьё, до скоринга). */
export type FindingInput = {
  domain: string;               // 'ux-os', 'checkout-os', 'seo-os', 'retention-os'…
  key?: string;                 // семантический ключ дедупа: одна проблема из разных отчётов
                                // эмитится с одним key → в реестре сливается в одну находку
  title: string;                // короткая суть находки
  as_is?: string;               // как есть
  to_be?: string;               // как должно быть
  gap?: string;                 // разрыв
  funnelStep?: FunnelStep;      // где в воронке (для денег и причинной карты)
  touchpoint?: string;          // точка касания
  impact: number;               // 1–5, влияние на бизнес
  difficulty?: number;          // 1–5, сложность/стоимость починки (по умолчанию 3)
  evidence?: EvidenceRef;       // слой доказательств
  evidenceLevel?: EvidenceLevel;// сила доказательства
  reproducibility?: string;     // «5/5», «2/2 попытки», «наблюдение», «не воспроизв.»
  source?: FindingSource;       // кто источник (сайт/данные/тест/поиск)
  benchmarkSource?: string;     // эталон/бенчмарк, если находка опирается на норму
  rawConfidence?: number;       // 0..1 — если модуль-источник уже дал уверенность
  refs?: string[];              // в каких отчётах фигурирует (UX/Journey/Механики…)
};

/** Находка после скоринга — то, что читают все отчёты. */
export type Finding = Omit<FindingInput, 'difficulty'> & {
  id: string;
  difficulty: number;
  confidence: number;        // 0..1 детерминированная
  impactConfidence: number;  // (impact/5) × confidence, 0..1
  revenueExposure: number;   // ₴/год, атрибутировано из money.ts
  priorityScore: number;     // Impact×Confidence×Revenue / Cost (сырой ранг)
  priority: Priority;        // полоса P0/P1/P2
  rootCause?: string;        // заполняется причинной картой
  dependsOn?: string[];      // ID-зависимости (причинно-следственная связь)
};

/* ─────────── Веса факторов уверенности (детерминированные) ─────────── */
const EVIDENCE_W: Record<EvidenceLevel, number> = { E1: 0.55, E2: 0.72, E3: 0.88, E4: 1.0 };
const SOURCE_W: Record<FindingSource, number> = {
  'сайт': 1.0, 'данные': 1.0, 'внешний-поиск': 0.8, 'unknown': 0.7, 'сеть': 0.5, 'браузер/тест': 0.4,
};
const COVERAGE_W: Record<CoverageStatus, number> = { covered: 1.0, partial: 0.78, external: 0.72, 'needs-access': 0.55 };

/** Воспроизводимость строкой → вес 0..1. «5/5»→1, «2/5»→0.4, наблюдение→0.65. */
export function reproWeight(repro?: string): number {
  if (!repro) return 0.7;
  const s = repro.toLowerCase();
  const frac = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) { const a = +frac[1], b = +frac[2]; if (b > 0) return Math.max(0.2, Math.min(1, a / b)); }
  if (/не\s*воспроизв|таймаут|не удал|ни одна/.test(s)) return 0.35;
  if (/подтвержд|стабильн|каждый раз|5\/5|воспроизвод/.test(s)) return 1.0;
  if (/наблюдени|однократн|один раз|разово/.test(s)) return 0.6;
  return 0.7;
}

/** Детерминированная уверенность = Evidence × Reproducibility × Source × Coverage. */
export function computeConfidence(f: FindingInput, coverage: CoverageStatus = 'covered'): number {
  const evLevel = f.evidenceLevel ?? (f.rawConfidence != null
    ? (f.rawConfidence >= 0.8 ? 'E3' : f.rawConfidence >= 0.6 ? 'E2' : 'E1')
    : 'E2');
  const w = EVIDENCE_W[evLevel] * reproWeight(f.reproducibility) * (SOURCE_W[f.source ?? 'unknown'] ?? 0.7) * COVERAGE_W[coverage];
  // если модуль дал свою уверенность — не даём формуле её завысить (кап raw+0.15)
  const capped = f.rawConfidence != null ? Math.min(w, f.rawConfidence + 0.15) : w;
  return Math.round(Math.max(0, Math.min(1, capped)) * 100) / 100;
}

/* ─────────── Деньги: шаг воронки → рычаг money.ts ─────────── */
const STEP_TO_LEVER: Record<FunnelStep, LeverKey | null> = {
  'привлечение': 'traffic', 'каталог': 'cr', 'карточка': 'cr', 'корзина': 'cr',
  'чекаут': 'cr', 'оплата': 'pay', 'доставка': 'redeem', 'доверие': 'cr',
  'retention': 'repeat', 'аналитика': null, 'право': null, 'сквозной': null,
};

/** Строит карту «шаг воронки → ₴/год» из водопада money.ts (для атрибуции). */
export function moneyByStep(m?: MoneyResult | null): Partial<Record<FunnelStep, number>> {
  const out: Partial<Record<FunnelStep, number>> = {};
  if (!m) return out;
  const byLever = new Map<LeverKey, number>();
  for (const w of m.waterfall) byLever.set(w.key, (byLever.get(w.key) ?? 0) + w.contribYear);
  for (const step of Object.keys(STEP_TO_LEVER) as FunnelStep[]) {
    const lever = STEP_TO_LEVER[step];
    if (lever && byLever.has(lever)) out[step] = byLever.get(lever)!;
  }
  return out;
}

/* ─────────── Сборка реестра ─────────── */
export type RegistryCtx = {
  coverageByDomain?: Record<string, CoverageStatus>; // покрытие каждого домена (для confidence)
  money?: MoneyResult | null;                         // денежная модель (для revenue exposure)
  idPrefixByDomain?: Record<string, string>;          // напр. { 'checkout-os': 'CHK' }
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();

/** Assigns IDs, computes confidence/impact×confidence/revenue/priority; dedupes; sorts by priority. */
export function buildRegistry(inputs: FindingInput[], ctx: RegistryCtx = {}): Finding[] {
  const cov = ctx.coverageByDomain ?? {};

  // 1) дедуп по (домен + семантический key ИЛИ нормализованный заголовок)
  const byKey = new Map<string, FindingInput>();
  for (const f of inputs) {
    const key = `${f.domain}::${f.key ? f.key.toLowerCase() : norm(f.title)}`;
    const prev = byKey.get(key);
    if (!prev) { byKey.set(key, { ...f, refs: [...(f.refs ?? [])] }); continue; }
    // слияние: держим больший impact, лучшее доказательство, объединяем refs
    prev.impact = Math.max(prev.impact, f.impact);
    prev.refs = Array.from(new Set([...(prev.refs ?? []), ...(f.refs ?? [])]));
    if (!prev.evidence && f.evidence) prev.evidence = f.evidence;
    if (!prev.as_is && f.as_is) prev.as_is = f.as_is;
    if (!prev.gap && f.gap) prev.gap = f.gap;
    if (f.evidenceLevel && (!prev.evidenceLevel || EVIDENCE_W[f.evidenceLevel] > EVIDENCE_W[prev.evidenceLevel])) prev.evidenceLevel = f.evidenceLevel;
  }
  const merged = Array.from(byKey.values());

  // 2) скоринг каждой находки (id назначается на шаге 4)
  const scored = merged.map((f) => {
    const difficulty = f.difficulty ?? 3;
    const confidence = computeConfidence(f, cov[f.domain] ?? 'covered');
    const impactConfidence = Math.round((Math.min(5, Math.max(1, f.impact)) / 5) * confidence * 100) / 100;
    return { ...f, id: '', difficulty, confidence, impactConfidence };
  });

  // 3) атрибуция денег ПО РЫЧАГУ money.ts (несколько шагов делят один рычаг — иначе
  //    один и тот же вклад cr задваивался бы на каталог+карточку+чекаут). ₴/год рычага
  //    делятся между всеми находками этого рычага пропорционально impact×confidence.
  const leverContrib = new Map<LeverKey, number>();
  if (ctx.money) for (const w of ctx.money.waterfall) leverContrib.set(w.key, (leverContrib.get(w.key) ?? 0) + w.contribYear);
  const leverOf = (step?: FunnelStep): LeverKey | null => (step ? STEP_TO_LEVER[step] : null);
  const icByLever = new Map<LeverKey, number>();
  for (const f of scored) { const lv = leverOf(f.funnelStep); if (lv && leverContrib.has(lv)) icByLever.set(lv, (icByLever.get(lv) ?? 0) + f.impactConfidence); }
  const withMoney: Finding[] = scored.map((f): Finding => {
    const lv = leverOf(f.funnelStep);
    let revenueExposure = 0;
    if (lv && leverContrib.has(lv)) {
      const totalIc = icByLever.get(lv) || 1;
      revenueExposure = Math.round((leverContrib.get(lv)! * f.impactConfidence) / totalIc);
    }
    const priorityScore = Math.round((f.impactConfidence * Math.max(revenueExposure, 1)) / f.difficulty);
    return { ...f, revenueExposure, priorityScore, priority: band(f.impact, f.confidence, f.funnelStep, f.impactConfidence) };
  });

  // 4) ID по домену (стабильный порядок: по убыванию приоритета внутри домена)
  const idPrefix = ctx.idPrefixByDomain ?? {};
  const counters = new Map<string, number>();
  const ordered = withMoney.slice().sort((a, b) => rank(a) - rank(b));
  // назначаем ID в порядке доменной группировки, но по важности внутри домена
  const byDomain = new Map<string, Finding[]>();
  for (const f of ordered) { (byDomain.get(f.domain) ?? byDomain.set(f.domain, []).get(f.domain)!).push(f); }
  for (const [domain, list] of byDomain) {
    const prefix = idPrefix[domain] ?? domain;
    for (const f of list) {
      const n = (counters.get(domain) ?? 0) + 1; counters.set(domain, n);
      f.id = `${prefix}-${String(n).padStart(3, '0')}`;
    }
  }
  return ordered;
}

/** Полоса приоритета по КАЧЕСТВУ находки (impact × confidence), а не по деньгам самим
 *  по себе: одни большие деньги на слабой находке не должны давать P0. Деньги влияют
 *  на ранг (priorityScore) внутри полосы. Блокер воронки повышает планку. */
function band(impact: number, confidence: number, step: FunnelStep | undefined, impactConfidence: number): Priority {
  const blocker = step === 'чекаут' || step === 'оплата' || step === 'корзина';
  if ((impact >= 4 && confidence >= 0.6) || (blocker && impact >= 3 && confidence >= 0.55)) return 'P0';
  if ((impact >= 3 && confidence >= 0.5) || impactConfidence >= 0.45) return 'P1';
  return 'P2';
}

const BAND_RANK: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
/** Сортировка: полоса → priorityScore ↓ → impactConfidence ↓. */
function rank(f: Finding): number { return BAND_RANK[f.priority] * 1e12 - f.priorityScore; }

/** Короткая сводка реестра для exec/беклога. */
export function registrySummary(findings: Finding[]): { total: number; p0: number; p1: number; p2: number; exposureYear: number } {
  return {
    total: findings.length,
    p0: findings.filter((f) => f.priority === 'P0').length,
    p1: findings.filter((f) => f.priority === 'P1').length,
    p2: findings.filter((f) => f.priority === 'P2').length,
    // атрибуция по рычагу делит ₴/год рычага между его находками нацело,
    // поэтому прямая сумма exposure не задваивает (Σ ≤ потенциал воронки).
    exposureYear: findings.reduce((s, f) => s + f.revenueExposure, 0),
  };
}
