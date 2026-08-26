/**
 * Уровни данных аудита и правило их сопоставления.
 *
 * ПРИНЦИП. У аудита не один источник истины, а четыре потока, и они не заменяют
 * друг друга, а дополняют:
 *
 *   L1 · ПРЯМОЙ ДОСТУП   — мы сами читаем систему клиента (GA4, GSC, рекламные
 *                          кабинеты, CRM). Идеал, к которому мы ведём каждый проект.
 *   L2 · ВЫГРУЗКА        — доступа нет, но клиент выгрузил из той же системы
 *                          файлом. Те же данные, но снимок и без возможности
 *                          перепроверить срез.
 *   L3 · ВНЕШНИЙ ИСТОЧНИК — то, что видно снаружи без доступов: обход сайта,
 *                          CrUX, PageSpeed, витрины маркетплейсов, рекламные
 *                          библиотеки, отзывы, сторонние трекеры.
 *   C  · СЛОВО КЛИЕНТА    — анкета, интервью, документы, переписка. Идёт ВСЕГДА,
 *                          параллельно всем трём, а не «когда больше нечего».
 *
 * ДВА ПРАВИЛА, ради которых этот модуль существует.
 *
 * 1. Наличие уровня выше НЕ отменяет уровни ниже. Даже с полным L1 мы читаем
 *    слово клиента и внешние данные: расхождение между ними — это находка, а не
 *    шум. «В GA4 конверсия 1.2 %, владелец называет 3 %» — здесь диагноз не в
 *    том, кто прав, а в том, что компания принимает решения по цифре, которой
 *    нет в её же системе.
 *
 * 2. Источник может БЫТЬ и при этом не работать. GA4 стоит — но события
 *    задваиваются; пиксель установлен — но не передаёт value; CRM есть — но
 *    статусы ведут вручную и половина сделок без источника. Поэтому у каждого
 *    источника два разных свойства: доступен ли он нам (level) и можно ли верить
 *    его числам (trust). Аудитор обязан проверить инструмент, а не только снять
 *    с него показания.
 */

/** Уровень происхождения данных. Не «качество» — именно способ получения. */
export type EvidenceLevel = 'L1' | 'L2' | 'L3' | 'C';

/** Пригодность самих чисел. Отдельно от уровня — источник бывает и сломан. */
export type SourceTrust =
  | 'verified'      // проверили настройку и сходимость — числам верим
  | 'unverified'    // данные есть, настройку не проверяли
  | 'suspect'       // видны признаки неверной настройки (двойной счёт, дыры, аномалии)
  | 'broken';       // формально подключён, фактически не собирает

export const LEVEL_TITLE: Record<EvidenceLevel, string> = {
  L1: 'прямой доступ к системе клиента',
  L2: 'выгрузка из системы клиента (файл)',
  L3: 'внешний источник без доступов',
  C: 'слово клиента: анкета, интервью, документы',
};

/**
 * Формулировки разные для СИСТЕМ и для слова клиента: анкета не бывает
 * «настроена неверно», она бывает неполной. Одна и та же метка на обоих читалась
 * бы в отчёте как бессмыслица.
 */
const TRUST_SYSTEM: Record<SourceTrust, string> = {
  verified: 'источник читается напрямую, настройка проверена',
  unverified: '',                                  // норма по умолчанию, не предупреждение
  suspect: 'есть признаки неверной настройки',
  broken: 'подключён, но данные не собираются',
};
const TRUST_CLIENT: Record<SourceTrust, string> = {
  verified: 'подтверждено документами',
  unverified: '',
  suspect: 'данных мало — только как гипотеза',
  broken: 'сведения противоречивы',
};
export const trustTitle = (t: SourceTrust, level: EvidenceLevel): string =>
  (level === 'C' ? TRUST_CLIENT : TRUST_SYSTEM)[t];

export type EvidenceSource = {
  id: string;
  title: string;
  level: EvidenceLevel;
  trust: SourceTrust;
  /** Чем именно подтверждена или опровергнута настройка. */
  why?: string;
};

/** Утверждение об одной величине из одного источника — для сопоставления. */
export type Claim = {
  metric: string;          // «конверсия сайта», «выручка за месяц», «доля мобильных»
  value: string;           // как есть, строкой: единицы и период у всех разные
  source: string;          // id источника
  level: EvidenceLevel;
  period?: string;
};

/** Расхождение между источниками по одной величине. */
export type Divergence = {
  metric: string;
  claims: Claim[];
  /** Почему это важно клиенту, а не просто «цифры не сошлись». */
  meaning: string;
};

/**
 * Найти величины, о которых говорят несколько источников. Само расхождение
 * НЕ разрешаем — числа в разных единицах и периодах, судить об этом должен
 * аудитор. Наша задача — не дать ему пройти мимо.
 */
export function crossCheck(claims: Claim[]): Divergence[] {
  const byMetric = new Map<string, Claim[]>();
  for (const c of claims) {
    const key = c.metric.trim().toLowerCase();
    byMetric.set(key, [...(byMetric.get(key) ?? []), c]);
  }
  const out: Divergence[] = [];
  for (const [, group] of byMetric) {
    if (group.length < 2) continue;
    const levels = new Set(group.map((c) => c.level));
    const values = new Set(group.map((c) => c.value.trim()));
    if (values.size < 2) continue;   // говорят одно и то же — сходится
    out.push({
      metric: group[0].metric,
      claims: group,
      meaning: levels.has('C') && (levels.has('L1') || levels.has('L2'))
        ? 'Компания принимает решения по числу, которого нет в её собственной системе. '
          + 'Разбираться нужно с обоими: и с цифрой, и с тем, откуда взялось убеждение.'
        : 'Два источника об одном и том же расходятся — значит, минимум один настроен неверно. '
          + 'До выяснения оба числа в выводы не берём.',
    });
  }
  return out;
}

/** Сколько чего у нас есть — по уровням. Для шапки раздела «Данные». */
export function levelSummary(sources: EvidenceSource[]): Record<EvidenceLevel, number> {
  const n: Record<EvidenceLevel, number> = { L1: 0, L2: 0, L3: 0, C: 0 };
  for (const s of sources) n[s.level] += 1;
  return n;
}

/**
 * Блок в промпт: какие уровни у нас есть по этому клиенту и как с ними
 * обращаться. Идёт в НЕкешируемую часть — состав источников свой у каждого.
 */
export function evidenceBlock(sources: EvidenceSource[]): string {
  const n = levelSummary(sources);
  const L: string[] = ['# УРОВНИ ДАННЫХ ПО ЭТОМУ КЛИЕНТУ'];
  L.push(`L1 прямой доступ: ${n.L1} · L2 выгрузки: ${n.L2} · L3 внешние: ${n.L3} · C слово клиента: ${n.C}`);

  for (const lv of ['L1', 'L2', 'L3', 'C'] as EvidenceLevel[]) {
    const list = sources.filter((s) => s.level === lv);
    if (!list.length) continue;
    L.push(`\n${lv} — ${LEVEL_TITLE[lv]}:`);
    for (const s of list) {
      // Предупреждаем только там, где есть о чём: `unverified` — обычное
      // состояние источника, а не проблема.
      const t = trustTitle(s.trust, lv);
      const flag = s.trust === 'suspect' || s.trust === 'broken' ? `  ⚠️ ${t}` : t ? `  · ${t}` : '';
      L.push(`  • ${s.title}${flag}${s.why ? ` — ${s.why}` : ''}`);
    }
  }

  // Сломанная СИСТЕМА и неполное слово клиента — разные вещи, и вывод из них разный.
  const shakySystem = sources.filter((x) => x.level !== 'C' && (x.trust === 'suspect' || x.trust === 'broken'));
  if (shakySystem.length) {
    L.push(`\nСистемы, чьим числам нельзя верить как есть (${shakySystem.length}): `
      + shakySystem.map((x) => x.title).join('; ')
      + '. Их показания в выводы не берём, пока расхождение не объяснено. Но САМ ФАКТ неверной '
      + 'настройки — находка уровня P0: компания принимает решения по числам, которых её система '
      + 'не собирает, и не знает об этом.');
  }
  const thinClient = sources.filter((x) => x.level === 'C' && (x.trust === 'suspect' || x.trust === 'broken'));
  if (thinClient.length) {
    L.push(`\nСо стороны клиента данных мало (${thinClient.map((x) => x.title).join('; ')}). `
      + 'Это не повод молчать: называй, каких именно сведений не хватило и на какие выводы это повлияло.');
  }

  L.push(`
ПРАВИЛА РАБОТЫ С УРОВНЯМИ (обязательны):
1. Наличие L1 не отменяет C и L3. Читай все уровни и сопоставляй. Совпадение
   двух независимых уровней усиливает вывод; расхождение — самостоятельная находка.
2. У каждого вывода указывай, на чём он стоит: уровень источника и период.
   Вывод без источника — это мнение, его помечай как гипотезу с низкой уверенностью.
3. Отличай «системы нет» от «система есть, но настроена неверно». Второе опаснее:
   клиент уверен, что у него есть данные, и принимает по ним решения.
4. Чего нет — называй прямо. Пропуск, поданный как вывод, дороже честного «не проверялось».
5. Не подменяй уровень: цифра из разговора не становится фактом от того, что её
   повторили в отчёте. Она остаётся C, пока не подтверждена L1/L2.`);
  return L.join('\n');
}

/* ─── Сборка уровней из того, что реально есть по клиенту ────────────────── */

type Pack = Record<string, unknown>;
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v as Record<string, unknown>[] : []);
const s = (v: unknown): string => (v == null ? '' : String(v));

/**
 * Разложить базу знаний клиента и реестр коннекторов по уровням.
 *
 * Ключевой разбор — в статусах доступа. `granted`/`verified` в каталоге значит,
 * что нам ОТКРЫЛИ систему: это L1. Но открыть — не значит, что она собирает
 * правильно, поэтому trust ставится `unverified`, пока аудит не проверил
 * настройку. Файловая выгрузка той же системы — L2, и она не отменяет L1: если
 * есть оба, их надо сверить между собой.
 */
export function buildEvidence(
  pack: Pack | null | undefined,
  externalReady: { id: string; title: string }[] = [],
): EvidenceSource[] {
  const out: EvidenceSource[] = [];
  const p = pack && typeof pack === 'object' ? pack : {};

  // Если по системе есть РАЗБОР её данных, строка «доступ выдан» лишняя: она
  // говорит меньше (нет периода, нет признаков поломки) и в сводке уровней
  // считается вторым источником, которого на самом деле нет.
  const parsed = new Set<string>();
  if ((p.search as { totals?: unknown } | undefined)?.totals) parsed.add('search console');

  for (const a of arr(p.accesses)) {
    const st = s(a.status);
    if (parsed.has(s(a.system).toLowerCase().replace(/^google\s+/, ''))) continue;
    if (st === 'granted' || st === 'verified') {
      out.push({
        id: `acc:${s(a.system)}`, title: s(a.system), level: 'L1',
        // `verified` в каталоге означает «доступ проверен», а не «данные корректны».
        // `verified` в каталоге доступов = «нас пустили», а не «данные верны».
        trust: 'unverified',
        why: st === 'verified' ? 'доступ подтверждён, сбор не проверялся' : undefined,
      });
    }
  }

  for (const f of arr(p.files)) {
    out.push({
      id: `file:${s(f.title)}`, title: s(f.title) || 'файл клиента', level: 'L2',
      trust: 'unverified', why: s(f.why) || undefined,
    });
  }

  for (const m of arr(p.marketplaces)) {
    if (!m.name) continue;
    const st = s(m.status);
    out.push({
      id: `mkt:${s(m.name)}`, title: `${s(m.name)} (кабінет майданчика)`,
      level: st === 'granted' || st === 'verified' ? 'L1' : 'L3',
      trust: 'unverified',
    });
  }

  for (const e of externalReady) {
    // Публичный источник: доступ не нужен, читается напрямую — метка доверия
    // здесь и есть всё объяснение, дублировать её в `why` незачем.
    out.push({ id: e.id, title: e.title, level: 'L3', trust: 'verified' });
  }

  // Search Console — L1 в самом чистом виде: мы прочитали систему клиента, а не
  // услышали про неё. Но «подключён» ещё не значит «собирает правильно»: сайт с
  // показами и нулём кликов чаще всего измеряется неверно, а не работает плохо.
  const sd = p.search as { totals?: { clicks?: number; impressions?: number }; period?: { start?: string; end?: string }; counts?: { truncated?: boolean } } | undefined;
  if (sd?.totals) {
    const imp = Number(sd.totals.impressions) || 0;
    const clk = Number(sd.totals.clicks) || 0;
    const broken = imp > 0 && clk === 0;
    out.push({
      id: 'l1:gsc',
      title: `Search Console${sd.period?.start ? ` (${s(sd.period.start)}…${s(sd.period.end)})` : ''}`,
      level: 'L1',
      // Не `verified`: мы прочитали данные, но не проверяли, верно ли привязан
      // ресурс, все ли домены в нём и совпадает ли он с тем, что в GA4.
      trust: broken ? 'suspect' : 'unverified',
      why: broken
        ? 'показы есть, кликов ноль — похоже на неверную привязку ресурса, а не на отсутствие спроса'
        : (sd.counts?.truncated ? 'выборка обрезана по верхним запросам — не весь сайт' : undefined),
    });
  }

  const ac = p.answersCount as { done?: number; total?: number } | undefined;
  if (ac?.total) {
    const done = ac.done ?? 0;
    const thin = done / ac.total < 0.6;
    out.push({
      id: 'c:survey', title: `Анкета клиента (${done}/${ac.total})`, level: 'C',
      trust: thin ? 'suspect' : 'unverified',
    });
  }
  const notes = Array.isArray(p.notes) ? p.notes.length : 0;
  if (notes) out.push({ id: 'c:notes', title: `Заметки консультанта (${notes})`, level: 'C', trust: 'unverified' });
  if (p.company && Object.keys(p.company as object).length) {
    out.push({ id: 'c:profile', title: 'Профиль компании со слов клиента', level: 'C', trust: 'unverified' });
  }

  return out;
}
