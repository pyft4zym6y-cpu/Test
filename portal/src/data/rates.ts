/**
 * Rate card из Cost Base Commerce OS. Два класса цифр:
 * confirmed=true — ставки из реальных полученных КП (факт рынка, с источником);
 * остальное — рыночные вилки 2025 (подаются как оценка).
 * Все ставки в €, если не указано иное.
 */

export type RateItem = {
  id: string;
  block: string;
  name: string;
  type: 'Разовая' | 'Ретейнер/мес';
  min: number; // €
  max: number; // €
  months?: number; // по умолчанию для ретейнеров
  confirmed?: boolean;
  source?: string;
  note?: string;
};

export const EUR_RATE_DEFAULT = 48; // ₴ за €, правится в интерфейсе

export const RATE_ITEMS: RateItem[] = [
  // A · Консалтинг
  { id: 'a1', block: 'A · Консалтинг и управление', name: 'Диагностика / Discovery-аудит', type: 'Разовая', min: 3000, max: 6000 },
  { id: 'a2', block: 'A · Консалтинг и управление', name: 'Управление программой (PMO)', type: 'Ретейнер/мес', min: 1500, max: 3000, months: 12 },
  { id: 'a3', block: 'A · Консалтинг и управление', name: 'Стратегическое сопровождение (fractional)', type: 'Ретейнер/мес', min: 1000, max: 2500, months: 12 },
  { id: 'a4', block: 'A · Консалтинг и управление', name: 'Финмодель / юнит-экономика', type: 'Разовая', min: 1500, max: 3500 },
  // B · Бренд
  { id: 'b1', block: 'B · Бренд', name: 'Бренд-стратегия и позиционирование', type: 'Разовая', min: 3000, max: 8000 },
  { id: 'b2', block: 'B · Бренд', name: 'Визуальная идентичность (система)', type: 'Разовая', min: 2000, max: 6000 },
  { id: 'b3', block: 'B · Бренд', name: 'Брендбук / гайдлайны', type: 'Разовая', min: 1500, max: 5000 },
  { id: 'b4', block: 'B · Бренд', name: 'Коммуникационная платформа', type: 'Разовая', min: 1000, max: 3000 },
  // C · Контент
  { id: 'c1', block: 'C · Контент и продакшн', name: 'Копирайтинг сайта (≈20 страниц)', type: 'Разовая', min: 600, max: 1600 },
  { id: 'c2', block: 'C · Контент и продакшн', name: 'SEO-тексты (≈30 шт)', type: 'Разовая', min: 750, max: 1800 },
  { id: 'c3', block: 'C · Контент и продакшн', name: 'SMM / контент-план', type: 'Ретейнер/мес', min: 500, max: 1500, months: 12 },
  // D · UX/UI
  { id: 'd1', block: 'D · UX/UI дизайн', name: 'UX-аудит / CJM', type: 'Разовая', min: 1000, max: 3000 },
  { id: 'd2', block: 'D · UX/UI дизайн', name: 'UI-дизайн ключевых страниц (≈15)', type: 'Разовая', min: 1200, max: 3750 },
  { id: 'd3', block: 'D · UX/UI дизайн', name: 'Дизайн-система сайта', type: 'Разовая', min: 2000, max: 6000 },
  // E · Разработка
  {
    id: 'e0', block: 'E · Web-разработка', name: 'Интернет-магазин под ключ (ТЗ→дизайн→вёрстка→разработка→запуск)',
    type: 'Разовая', min: 17500, max: 19000, confirmed: true,
    source: 'КП подрядчика, проект ASIAFOODS (OpenCart, миграция с Prom.ua): $18 980, 5–5,5 мес',
    note: 'Пропорции: разработка ≈52%, дизайн+вёрстка ≈39%, аналитика и запуск ≈9%',
  },
  { id: 'e1', block: 'E · Web-разработка', name: 'Frontend-разработка', type: 'Разовая', min: 4000, max: 15000 },
  { id: 'e2', block: 'E · Web-разработка', name: 'Корзина, чекаут, оплата', type: 'Разовая', min: 2000, max: 6000 },
  { id: 'e3', block: 'E · Web-разработка', name: 'Интеграции (×6)', type: 'Разовая', min: 3000, max: 15000 },
  { id: 'e4', block: 'E · Web-разработка', name: 'Техподдержка сайта', type: 'Ретейнер/мес', min: 500, max: 2000, months: 12 },
  // G · ERP
  { id: 'g1', block: 'G · ERP и автоматизация', name: 'ERP (Odoo) — внедрение', type: 'Разовая', min: 10000, max: 30000 },
  { id: 'g2', block: 'G · ERP и автоматизация', name: 'Интеграция ERP ↔ сайт ↔ МП', type: 'Разовая', min: 3000, max: 10000 },
  // H · Аналитика
  { id: 'h1', block: 'H · Аналитика / BI', name: 'Настройка GA4 / GTM / consent', type: 'Разовая', min: 1000, max: 3000 },
  { id: 'h2', block: 'H · Аналитика / BI', name: 'BI-слой / дашборды', type: 'Разовая', min: 2000, max: 6000 },
  { id: 'h3', block: 'H · Аналитика / BI', name: 'Аналитик (ретейнер)', type: 'Ретейнер/мес', min: 1000, max: 2500, months: 12 },
  // I · CRM
  { id: 'i1', block: 'I · CRM / Retention', name: 'Настройка флоу и автоматизаций', type: 'Разовая', min: 1500, max: 5000 },
  { id: 'i2', block: 'I · CRM / Retention', name: 'Email/CRM платформа', type: 'Ретейнер/мес', min: 100, max: 800, months: 12 },
  { id: 'i3', block: 'I · CRM / Retention', name: 'RFM-сегментация / реактивация', type: 'Разовая', min: 800, max: 2500 },
  { id: 'i4', block: 'I · CRM / Retention', name: 'Программа лояльности', type: 'Разовая', min: 1000, max: 4000 },
  // J · SEO
  { id: 'j1', block: 'J · SEO', name: 'Технический SEO-аудит', type: 'Разовая', min: 800, max: 2500 },
  { id: 'j2', block: 'J · SEO', name: 'Семантика и структура', type: 'Разовая', min: 1000, max: 3000 },
  {
    id: 'j3', block: 'J · SEO', name: 'SEO-ретейнер (агентство)', type: 'Ретейнер/мес', min: 617, max: 771, months: 12,
    confirmed: true, source: 'КП SEO-агентства: 25 920–32 400 грн/мес, топ-10 за 12–16 мес',
    note: 'Рекламный бюджет — отдельной строкой (26 000–37 000 грн/мес)',
  },
  { id: 'j4', block: 'J · SEO', name: 'Линкбилдинг', type: 'Ретейнер/мес', min: 300, max: 1500, months: 6 },
  // K · Performance
  { id: 'k1', block: 'K · Performance / медиа', name: 'PPC-агентство (fee)', type: 'Ретейнер/мес', min: 500, max: 2000, months: 12 },
  { id: 'k2', block: 'K · Performance / медиа', name: 'Рекламный бюджет Meta/Google', type: 'Ретейнер/мес', min: 3000, max: 10000, months: 12, note: 'Медиа, не работы — отдельная строка сметы' },
  // L · Маркетплейсы
  { id: 'l1', block: 'L · Маркетплейсы', name: 'Запуск Allegro (PL)', type: 'Разовая', min: 1000, max: 3000 },
  { id: 'l2', block: 'L · Маркетплейсы', name: 'Запуск Amazon (DE)', type: 'Разовая', min: 1500, max: 5000 },
  { id: 'l3', block: 'L · Маркетплейсы', name: 'Ведение МП ЕС', type: 'Ретейнер/мес', min: 500, max: 1500, months: 6 },
  // M · Фулфилмент
  {
    id: 'm1', block: 'M · Фулфилмент', name: '3PL Польша: комплектация заказа', type: 'Ретейнер/мес', min: 120, max: 500, months: 6,
    confirmed: true, source: 'Прайс склада (PLN): 3,50 PLN/заказ + 1,50 PLN/паллета/сутки, мин. инвойс 500 PLN/мес',
    note: 'Мин. инвойс 500 PLN/мес — порог окупаемости считать до входа',
  },
  { id: 'm2', block: 'M · Фулфилмент', name: '3PL ЕС — setup', type: 'Разовая', min: 1000, max: 4000 },
  // N · Юридика
  { id: 'n1', block: 'N · Юридика / комплаенс', name: 'Юрлицо Sp. z o.o. (PL)', type: 'Разовая', min: 1000, max: 3000 },
  { id: 'n2', block: 'N · Юридика / комплаенс', name: 'VAT / OSS регистрация', type: 'Разовая', min: 300, max: 1000 },
  { id: 'n3', block: 'N · Юридика / комплаенс', name: 'ТМ EUIPO (ЕС)', type: 'Разовая', min: 850, max: 2500 },
];
