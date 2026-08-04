import { QUESTIONS, optionsFor } from './model';
import {
  PAINS_QID, PAINS_CUSTOM_QID, GOALS_QID, PASSPORT_QID, LINKS_QID,
} from '../data/pains';
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
  put(
    PASSPORT_QID,
    JSON.stringify({
      name: 'Demo Store',
      site: 'https://demo-store.ua',
      offer: 'Собственная марка товаров для дома, D2C + маркетплейсы',
      niche: 'Дом · мебель · декор',
      channels: ['Свой интернет-магазин', 'Rozetka', 'Instagram / TikTok'],
      geo: 'Украина',
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

  for (const q of QUESTIONS) {
    if (q.level !== 'L1') continue;
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
