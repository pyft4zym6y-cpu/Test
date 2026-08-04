import { QUESTIONS, optionsFor } from './model';
import {
  PAINS_QID, PAINS_CUSTOM_QID, GOALS_QID, PASSPORT_QID, LINKS_QID,
} from '../data/pains';
import { BRIEF_TRIED_QID, BRIEF_TEAM_QID, BRIEF_AMBITION_QID } from '../data/method';
import { lsSaveAll } from './useAnswers';
import type { AnswerRow } from './supabase';

/** Заполняет демо-ответы: реалистичный «средний» бизнес с проблемами. */
export function seedDemo() {
  const rows: Record<string, AnswerRow> = {};
  const put = (id: string, answer: string) => {
    rows[id] = {
      client_id: 'demo',
      question_id: id,
      answer,
      facts: null,
      updated_by: 'demo',
    };
  };

  put(PAINS_QID, 'ads_expensive | low_repeat | no_data');
  put(PAINS_CUSTOM_QID, 'Поставщик поднял закупочные цены на 30% — маржа просела');
  put(GOALS_QID, 'g_sales | g_eu | g_ltv');
  put(BRIEF_TRIED_QID, 'Работали с двумя агентствами по рекламе — трафик рос, прибыль нет. SEO-подрядчик за год не дал результата.');
  put(BRIEF_TEAM_QID, 'Драйвить готов совладелец; в команде есть маркетолог на full-time.');
  put(BRIEF_AMBITION_QID, 'Через 3 года — топ-3 в нише в Украине + 30% выручки из ЕС, компания управляется без ежедневного участия собственника.');
  put(
    PASSPORT_QID,
    JSON.stringify({
      name: 'Demo Store',
      sites: ['https://demo-store.ua', 'https://demo-brand.eu'],
      offer: 'Собственная марка товаров для дома, D2C + маркетплейсы',
      niche: 'Дом · мебель · декор',
      channels: ['Интернет-магазин', 'Rozetka', 'Prom.ua', 'Instagram Shop', 'Allegro (PL)'],
      channelsOther: 'Wildberries (тест)',
      geo: 'Украина + Польша',
      revenue: '1–5 млн ₴/мес',
      team: '3 человека + подрядчик по рекламе',
    }),
  );
  put(
    LINKS_QID,
    JSON.stringify({
      direct: [
        { url: 'https://competitor-a.ua', note: 'сильное SEO, широкий каталог' },
        { url: 'https://competitor-b.ua', note: 'быстрая доставка, дешевле нас' },
      ],
      indirect: [{ url: 'https://rozetka.com.ua', note: 'наша категория' }],
      refs: [{ url: 'https://ray.ua', note: 'нравится подача бренда' }],
    }),
  );

  put('CO-006', 'Сайт: 45 | Маркетплейсы: 30 | Опт: 15 | Розница: 5 | Соцсети: 5');

  // Противоречия для демо консультантской ветки (вопросы к интервью)
  put('GV-003', 'По данным');
  put('AN-003', 'Нет');
  put('PR-001', 'По ценности');
  put('PX-013', 'Нет');
  put('FI-002', 'Да');
  put('FI-127', 'Не распределяются');

  put(
    'DECISION',
    JSON.stringify({
      reason: 'Растём медленнее рынка, реклама дорожает, хочу систему вместо ручного управления.',
      problems: ['Прибыль не растёт вместе с оборотом', 'Всё держится на мне', 'Не понимаем, какой канал прибыльный'],
      self: { strategy: 2, unit: 1, data: 2, funnel: 2, retention: 1, brand: 3, ops: 2, team: 2, tech: 3, finance: 1 },
      lprs: [
        { name: 'Андрей', role: 'CEO / Собственник', influence: 'Принимает решение', kpi: 'Стоимость компании, прибыль', matters: 'Не хочет второй «дорогой сайт без результата»' },
        { name: 'Ольга', role: 'CFO', influence: 'Влияет на решение', kpi: 'Маржа, кассовая дисциплина', matters: 'Транши под результат, без предоплат за воздух' },
      ],
      budget: { range: '$15–40K', tranches: 'Да, транши под результат', deadline: 'До конца квартала', cash: 'Пик Q4, провал январь–февраль' },
      team: [
        { role: 'Head of E-commerce', name: 'Игорь', hours: '10', area: 'Сайт, маркетплейсы' },
        { role: 'Маркетолог', name: 'Ната', hours: '6', area: 'Реклама, email' },
      ],
      outsource: 'Реклама — агентство, сайт — фрилансер',
    }),
  );

  for (const q of QUESTIONS) {
    if (q.level !== 'L1') continue;
    if (rows[q.id]) continue;
    const opts = optionsFor(q);
    if (/Да\/Нет/.test(q.type) && opts) {
      const r = Math.random();
      put(q.id, r < 0.3 ? opts[0] : r < 0.55 ? (opts[1] ?? opts[0]) : opts[opts.length - 1]);
    } else if (q.type === 'Число') {
      put(q.id, String(Math.round(5 + Math.random() * 40)));
    } else if (q.type === 'Шкала 0-5') {
      put(q.id, String(Math.round(1 + Math.random() * 3)));
    } else if (q.type === 'Выбор' && opts && Math.random() < 0.6) {
      put(q.id, opts[Math.floor(Math.random() * opts.length)]);
    }
  }
  lsSaveAll(rows);
}
