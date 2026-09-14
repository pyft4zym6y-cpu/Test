/**
 * Сценарії клієнта: вхід у сайт з боку проблеми, а не з боку нашої таксономії.
 *
 * Сайт був побудований навколо власної архітектури: спершу вісім систем,
 * потім девʼять експертиз — два переліки однакового рангу. Людина, яка
 * прийшла вперше, мусила сама зрозуміти, що саме вона купує: систему чи
 * експертизу. Найкраще це видно на блозі: 30 із 44 статей довелося привʼязати
 * одночасно й до системи, і до експертизи, бо відповісти «куди вона
 * належить» було неможливо.
 *
 * Насправді переліки не конкурують — вони на різних осях:
 *
 *   СИМПТОМ  — як проблема звучить словами власника;
 *   СИСТЕМА  — ДЕ вона живе (вісім систем, вісь діагнозу);
 *   ЕКСПЕРТИЗА — ЧИМ її лагодять (девʼять експертиз, вісь виконання).
 *
 * Тому сценарій не зберігає власного тексту симптому: він бере поле `feel` із
 * тієї самої системи, включно з англійським оверлеєм. Заводити третій перелік
 * формулювань означало б повторити ту саму помилку ще раз — тепер уже втричі.
 */
import { SYSTEMS, localizeSystem, type SystemKey } from '@/data/xray';
import { nameOf } from '@/lib/nav';

/** Двомовна пара — та сама домовленість, що в expertises.ts. */
type P = [uk: string, en: string];

export type Symptom = {
  /** Система, у якій живе причина. Вона ж дає формулювання симптому (`feel`). */
  system: SystemKey;
  /**
   * Підпис «Причина: …» — ДЕ шукати, мовою, якою власник шукає підрядника.
   *
   * Доти сюди йшла коротка назва системи з shortOf(). Вона працює в графіку
   * здоровʼя і в чипах кейсів, де поруч стоять усі вісім і видно шкалу, але в
   * картці симптому лишала людину з однією нашою назвою й без підказки, що це
   * взагалі за робота. «UX / UI / CRO» і «Acquisition / CRM / Retention»
   * називають ту саму причину словами, які людина вже чула.
   *
   * shortOf() не чіпаємо: у двох інших місцях він і далі потрібен саме коротким.
   */
  cause: P;
  /** Що симптом означає насправді — мовою грошей, а не мовою методології. */
  mean: P;
  /**
   * Експертизи, якими це лагодять. Слаги, а не назви: назви беремо з lib/nav,
   * щоб підпис у сценарії не розійшовся з назвою сторінки, куди він веде.
   */
  fix: string[];
};

export const SYMPTOMS: Symptom[] = [
  {
    system: 'commercial',
    cause: ['Комерція', 'Commerce'],
    mean: [
      'Продажі ростуть, але прибуток залишається незрозумілим. Немає чіткої картини маржинальності, CAC, LTV, юніт-економіки та реальної ефективності каналів.',
      'Sales grow, but the profit stays unclear. There is no clear picture of margin, CAC, LTV, unit economics or the real performance of each channel.',
    ],
    fix: ['data-growth', 'marketing', 'sales-channels'],
  },
  {
    system: 'experience',
    cause: ['UX / UI / CRO', 'UX / UI / CRO'],
    mean: [
      'Трафік є, але сайт не конвертує його в достатню кількість продажів. Клієнти губляться в навігації, не розуміють пропозицію або стикаються з барʼєрами на шляху до покупки.',
      'There is traffic, but the site does not convert enough of it into sales. Customers get lost in the navigation, miss the offer or hit barriers on the way to checkout.',
    ],
    fix: ['ux-ui', 'web-development', 'technology'],
  },
  {
    system: 'customer',
    cause: ['Acquisition / CRM / Retention', 'Acquisition / CRM / Retention'],
    mean: [
      'Вартість залучення зростає, база клієнтів не розвивається, а повторні продажі залишаються недооціненим джерелом прибутку.',
      'Acquisition costs keep rising, the customer base does not develop, and repeat sales remain an underrated source of profit.',
    ],
    fix: ['marketing', 'sales-channels', 'branding'],
  },
  {
    system: 'operations',
    cause: ['Операції', 'Operations'],
    mean: [
      'Склад, логістика, доставка, підтримка та обробка замовлень не витримують навантаження. Зростання продажів створює більше хаосу, а не більше прибутку.',
      'The warehouse, logistics, delivery, support and order handling cannot take the load. Growing sales create more chaos, not more profit.',
    ],
    fix: ['automation', 'technology', 'data-growth'],
  },
  {
    system: 'data',
    cause: ['Дані / аналітика / технології', 'Data / analytics / technology'],
    mean: [
      'Дані розкидані по різних системах, показники суперечать один одному, а рішення приймаються на припущеннях замість єдиної картини бізнесу.',
      'Data is scattered across systems, the metrics contradict each other, and decisions are made on assumptions instead of one picture of the business.',
    ],
    fix: ['data-growth', 'technology', 'automation'],
  },
  {
    system: 'org',
    cause: ['Організація', 'Organization'],
    mean: [
      'Нечіткі ролі, відсутність відповідальності, процесів і KPI не дають бізнесу працювати автономно та масштабуватися без постійного ручного контролю.',
      'Unclear roles and missing accountability, processes and KPIs stop the business from running on its own and scaling without constant manual control.',
    ],
    fix: ['automation', 'data-growth'],
  },
  {
    system: 'strategy',
    cause: ['Стратегія', 'Strategy'],
    mean: [
      'Немає зрозумілих пріоритетів, послідовності дій і відповіді на головне питання: які зміни дадуть найбільший вплив на продажі та прибуток.',
      'There are no clear priorities, no order of actions and no answer to the main question: which changes will have the biggest impact on sales and profit.',
    ],
    fix: ['branding', 'data-growth', 'marketing'],
  },
  {
    system: 'expansion',
    cause: ['Експансія', 'Expansion'],
    mean: [
      'Нові ринки, категорії, продукти та канали потребують системної оцінки. Без неї масштабування перетворюється на дорогі експерименти.',
      'New markets, categories, products and channels need systematic assessment. Without it, scaling turns into expensive experiments.',
    ],
    fix: ['international', 'sales-channels', 'marketing'],
  },
];

export type SymptomView = {
  /** Симптом словами власника — поле `feel` системи. */
  say: string;
  mean: string;
  /**
   * Де лежить причина. ТЕКСТ, а не посилання: вісім сторінок систем більше не
   * існують. Вони описували нашу внутрішню методологію, були сиротами в дереві
   * й дублювали і девʼять експертиз, і шістнадцять видів аудиту. Назва системи
   * лишається — вона пояснює, що саме зламалось; купують не її, а аудит.
   */
  systemTitle: string;
  /** Чим лагодимо: підпис + адреса сторінки експертизи. */
  fix: { path: string; title: string }[];
};

/** Сценарії для показу. Порядок фіксований — від найчастішого болю до рідшого. */
export function symptomsFor(lang: 'uk' | 'en'): SymptomView[] {
  return SYMPTOMS.map((s) => {
    const sys = SYSTEMS.find((x) => x.key === s.system)!;
    const loc = localizeSystem(sys, lang);
    return {
      say: loc.feel,
      mean: s.mean[lang === 'en' ? 1 : 0],
      /*
       * Назва причини — з самого сценарію, а не shortOf(). Підпис має бути
       * коротким (повна назва лягала на два рядки вже на 360px і робила картку
       * вищою за сусідні) і при цьому впізнаваним: «UX / UI / CRO» людина вже
       * чула, «Досвід і конверсія» — ні.
       */
      systemTitle: s.cause[lang === 'en' ? 1 : 0],
      fix: s.fix.map((slug) => {
        const path = `/expansion/${slug}`;
        return { path, title: nameOf(path, lang) };
      }),
    };
  });
}
