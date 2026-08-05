/**
 * Сборка клиентских материалов из анализа + обхода. Пока — редактируемые
 * черновики в Markdown (экспорт в .pptx/.docx подключим модулем позже, но
 * содержание уже готово по чертежам метода). Числа — из обхода/движка, язык и
 * структура — из метода, всё с метками факт/допущение.
 */
import type { AuditDataset } from './report.js';
import type { Analysis } from './analyze.js';
import { AD15_SLIDES } from './method.js';

function clientScore(ds: AuditDataset): number | null {
  const scored = ds.client.pages.filter((p) => p.score !== null);
  return scored.length ? Math.round(scored.reduce((s, p) => s + (p.score ?? 0), 0) / scored.length) : null;
}

/** Итоговая презентация AD-15 — черновик по слайдам. */
export function renderAD15(ds: AuditDataset, a: Analysis): string {
  const cs = clientScore(ds);
  const name = (() => { try { return new URL(ds.client.finalUrl).hostname.replace(/^www\./, ''); } catch { return ds.client.finalUrl; } })();
  const S: string[] = [];
  const slide = (n: number, title: string) => S.push(`\n---\n\n## Слайд ${n}. ${title}`);

  S.push(`# AD-15 · Итоговая презентация аудита — ЧЕРНОВИК`);
  S.push(`_Commerce OS · ${name} · тир T${ds.tier} · слой L0 (внешний обход). Все оценки — «наблюдение L0», порядок величины, не факт по данным клиента. Правьте перед отправкой клиенту._`);

  AD15_SLIDES.forEach((sl, i) => {
    slide(i + 1, sl.title);
    switch (sl.id) {
      case 'cover':
        S.push(`**${name}** · Диагностика Commerce OS · ${new Date(ds.takenAt).toLocaleDateString('ru-RU')}`);
        S.push(`_Статус: предварительная картина по внешнему обходу (без доступов)._`);
        break;
      case 'point-a':
        S.push(`**Соответствие витрины голд-стандарту: ${cs ?? '—'}%** (ср. по ${ds.client.pages.filter((p) => p.score !== null).length} страницам).`);
        S.push(a.healthNote || '_(healthNote не сгенерирован)_');
        S.push(`> Health Score по 100-балльной шкале посчитает движок портала после занесения находок в ЕКП.`);
        break;
      case 'diagnosis':
        if (a.pains.length) for (const p of a.pains) {
          S.push(`**Причина: ${p.cause}**`);
          if (p.symptoms?.length) S.push(`- Симптомы: ${p.symptoms.join('; ')}`);
          if (p.evidence?.length) S.push(`- Доказательство (обход): ${p.evidence.join('; ')}`);
        } else S.push('_(боли не сгенерированы)_');
        break;
      case 'cost':
        S.push(`Цена бездействия на L0 подаётся качественно: чем дольше не закрыты разрывы выше, тем больше упущенного оборота ежемесячно.`);
        S.push(`> ⚠️ Точная сумма недополученного оборота считается на слое L1 (нужен baseline: трафик, конверсия, чек). См. «Открытые вопросы».`);
        break;
      case 'point-b':
        S.push(`Точка Б — целевое состояние. Тактика 0–3 мес: закрыть дефекты обнаружимости и быстрые UX/SEO-разрывы. Стратегия 3–12 / 12–36 мес: системные контуры (аналитика, retention, юнит-экономика) по scope ниже.`);
        S.push(`_Каждую цель на L1 переведём в число с источником._`);
        break;
      case 'how': {
        const waves = [1, 2, 3];
        for (const w of waves) {
          const items = a.scope.filter((s) => (s.wave ?? 1) === w);
          if (!items.length) continue;
          S.push(`**Волна ${w}:**`);
          for (const it of items) S.push(`- ${it.playbook} — ${it.reason}`);
        }
        if (!a.scope.length) S.push('_(scope не сгенерирован)_');
        break;
      }
      case 'team':
        S.push(`Внутренние роли + внешние подрядчики подбираются под scope. Поимённый состав и ставки — из rate card (cost_base) на этапе КП.`);
        break;
      case 'budget':
        S.push(`Бюджет по блокам (разово CAPEX + ретейнеры ×мес) — вилка из rate card, помечается как оценка. Точный бюджет фиксируется в КП после утверждения scope.`);
        break;
      case 'roadmap':
        S.push(`См. отдельный документ «roadmap.md» — дорожная карта с диаграммой Ганта по волнам. У каждого этапа: срок, ориентир бюджета, исполнитель, измеримый критерий завершения (DoD).`);
        break;
      case 'next':
        S.push(`Что нужно от клиента для перехода на L1 и расчёта денег:`);
        for (const q of a.openQuestions.length ? a.openQuestions : ['Доступ к GA4/аналитике', 'Выгрузка заказов за 6–12 мес', 'Доступ к CRM и рекламным кабинетам']) S.push(`- ${q}`);
        break;
    }
  });

  S.push(`\n---\n_Резюме для собственника: ${a.summary || '—'}_`);
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

  // Mermaid Gantt
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
