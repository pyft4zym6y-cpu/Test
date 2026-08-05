/**
 * Сборка клиентских материалов из анализа + обхода. Единая слайд-модель AD-15
 * (buildAD15Model) питает и Markdown-черновик, и экспорт в .pptx. Числа — из
 * обхода/движка, структура и язык — из метода, всё с метками факт/допущение.
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';
import { AD15_SLIDES } from './method.js';

export type Slide = { n: number; title: string; subtitle?: string; bullets: string[]; note?: string };

function clientScore(ds: AuditDataset): number | null {
  const scored = ds.client.pages.filter((p) => p.score !== null);
  return scored.length ? Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length) : null;
}

export function clientName(ds: AuditDataset): string {
  try { return new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl; }
}

/** Слайд-модель AD-15 — единый источник для Markdown и .pptx. */
export function buildAD15Model(ds: AuditDataset, a: Analysis): Slide[] {
  const cs = clientScore(ds);
  const name = clientName(ds);
  const date = new Date(ds.takenAt).toLocaleDateString('ru-RU');
  const scoredN = ds.client.pages.filter((p) => p.score !== null).length;

  return AD15_SLIDES.map((sl, i): Slide => {
    const n = i + 1;
    switch (sl.id) {
      case 'cover':
        return { n, title: name, subtitle: `Диагностика Commerce OS · ${date}`,
          bullets: ['Предварительная картина по внешнему обходу (без доступов)', 'Статус оценок: наблюдение L0 — порядок величины'] };
      case 'point-a':
        return { n, title: 'Точка А — где вы сейчас', subtitle: `Соответствие витрины голд-стандарту: ${cs ?? '—'}% (по ${scoredN} стр.)`,
          bullets: [a.healthNote || 'Оценка зрелости появится после анализа', 'Health Score по 100-балльной шкале посчитает движок после занесения находок в ЕКП'] };
      case 'diagnosis':
        return { n, title: 'Диагноз системно',
          bullets: a.pains.length
            ? a.pains.flatMap((p) => [`Причина: ${p.cause}`, ...(p.symptoms?.length ? [`  симптомы: ${p.symptoms.join('; ')}`] : []), ...(p.evidence?.length ? [`  доказательство: ${p.evidence.join('; ')}`] : [])])
            : ['Боли не сгенерированы'] };
      case 'cost':
        return { n, title: 'Цена бездействия',
          bullets: ['Чем дольше не закрыты разрывы выше — тем больше упущенного оборота ежемесячно', '⚠️ Точная сумма считается на слое L1 (нужен baseline: трафик, конверсия, чек) — см. «Следующий шаг»'] };
      case 'point-b':
        return { n, title: 'Точка Б — куда придём',
          bullets: ['Тактика 0–3 мес: закрыть дефекты обнаружимости и быстрые UX/SEO-разрывы', 'Стратегия 3–12 / 12–36 мес: системные контуры (аналитика, retention, юнит-экономика)', 'Каждую цель на L1 переведём в число с источником'] };
      case 'how': {
        const bullets: string[] = [];
        for (const w of [1, 2, 3]) {
          const items = a.scope.filter((s) => (s.wave ?? 1) === w);
          if (!items.length) continue;
          bullets.push(`Волна ${w}:`);
          for (const it of items) bullets.push(`  ${it.playbook} — ${it.reason}`);
        }
        return { n, title: 'Как — программа и волны', bullets: bullets.length ? bullets : ['Scope не сгенерирован'] };
      }
      case 'team':
        return { n, title: 'Команда и подрядчики',
          bullets: ['Внутренние роли + внешние подрядчики — под scope', 'Поимённый состав и ставки — из rate card (cost_base) на этапе КП'] };
      case 'budget':
        return { n, title: 'Бюджет по блокам',
          bullets: ['Разово (CAPEX) + ретейнеры ×мес — вилка из rate card (оценка)', 'Точный бюджет фиксируется в КП после утверждения scope'] };
      case 'roadmap':
        return { n, title: 'Дорожная карта / Гант',
          bullets: ['Этапы по волнам со сроками — см. документ roadmap (диаграмма Ганта)', 'У каждого этапа: срок, ориентир бюджета, исполнитель, измеримый DoD'] };
      case 'next':
        return { n, title: 'Следующий шаг',
          bullets: ['Что нужно от клиента для перехода на L1 и расчёта денег:',
            ...(a.openQuestions.length ? a.openQuestions : ['Доступ к GA4/аналитике', 'Выгрузка заказов за 6–12 мес', 'Доступ к CRM и рекламным кабинетам']).map((q) => `  ${q}`)],
          note: a.summary ? `Резюме для собственника: ${a.summary}` : undefined };
      default:
        return { n, title: sl.title, bullets: [] };
    }
  });
}

/** AD-15 — Markdown-черновик из слайд-модели. */
export function renderAD15(ds: AuditDataset, a: Analysis): string {
  const model = buildAD15Model(ds, a);
  const S: string[] = [];
  S.push(`# AD-15 · Итоговая презентация аудита — ЧЕРНОВИК`);
  S.push(`_Commerce OS · ${clientName(ds)} · тир T${ds.tier} · слой L0. Оценки — «наблюдение L0», не факт по данным клиента. Правьте перед отправкой._`);
  for (const s of model) {
    S.push(`\n---\n\n## Слайд ${s.n}. ${s.title}`);
    if (s.subtitle) S.push(`**${s.subtitle}**`);
    for (const b of s.bullets) S.push(b.startsWith('  ') ? `  - ${b.trim()}` : `- ${b}`);
    if (s.note) S.push(`\n_${s.note}_`);
  }
  return S.join('\n');
}

/** Дорожная карта с Гантом (mermaid) по волнам scope. */
export function renderRoadmap(ds: AuditDataset, a: Analysis): string {
  const R: string[] = [];
  R.push(`# Дорожная карта развития и масштабирования — ЧЕРНОВИК`);
  R.push(`_Commerce OS · тир T${ds.tier}. Сроки ориентировочные (L0); уточняются после baseline и утверждения scope._\n`);

  const waveMeta: Record<number, { title: string; dod: string }> = {
    1: { title: 'Волна 1 · Фундамент и быстрые победы (0–3 мес)', dod: 'дефекты обнаружимости закрыты, аналитика считает корректно' },
    2: { title: 'Волна 2 · Рычаги роста (3–9 мес)', dod: 'CR и retention растут против baseline' },
    3: { title: 'Волна 3 · Масштабирование (9–24 мес)', dod: 'новые каналы/рынки проходят порог юнит-экономики' },
  };

  for (const w of [1, 2, 3]) {
    const items = a.scope.filter((s) => (s.wave ?? 1) === w);
    if (!items.length) continue;
    const m = waveMeta[w];
    R.push(`## ${m.title}`);
    for (const it of items) R.push(`- **${it.playbook}** — ${it.reason} · исполнитель: подбирается · DoD: ${m.dod}`);
    R.push('');
  }
  if (!a.scope.length) R.push('_(scope пуст — аналитический слой не сгенерировал плейбуки)_\n');

  R.push('## Диаграмма Ганта\n');
  R.push('```mermaid');
  R.push('gantt');
  R.push('    title Дорожная карта Commerce OS (ориентир, L0)');
  R.push('    dateFormat  YYYY-MM-DD');
  R.push('    axisFormat  %m.%y');
  const start = new Date(ds.takenAt);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (base: Date, days: number) => { const d = new Date(base); d.setDate(d.getDate() + days); return d; };
  const spans: Record<number, [number, number]> = { 1: [0, 90], 2: [60, 270], 3: [240, 720] };
  for (const w of [1, 2, 3]) {
    const items = a.scope.filter((s) => (s.wave ?? 1) === w);
    if (!items.length) continue;
    R.push(`    section Волна ${w}`);
    const [s0, s1] = spans[w];
    const per = Math.max(20, Math.round((s1 - s0) / Math.max(items.length, 1)));
    items.forEach((it, i) => {
      const from = plus(start, s0 + i * Math.min(per, 30));
      R.push(`    ${it.playbook.replace(/[:#]/g, ' ')} :${iso(from)}, ${per}d`);
    });
  }
  R.push('```');
  return R.join('\n');
}
