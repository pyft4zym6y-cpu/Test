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
    mean: [
      'Оборот зростає, а прибуток — ні: маржа, ціни й промо не пораховані до рішення, а не після кварталу.',
      'Turnover grows, profit does not: margin, prices and promos are never counted before the decision, only after the quarter.',
    ],
    fix: ['data-growth', 'marketing', 'sales-channels'],
  },
  {
    system: 'experience',
    mean: [
      'Трафік уже оплачений, а воронка втрачає його на конкретному кроці — у каталозі, картці або оформленні.',
      'The traffic is already paid for, and the funnel loses it at one specific step — the catalog, the product page or the checkout.',
    ],
    fix: ['ux-ui', 'web-development', 'technology'],
  },
  {
    system: 'customer',
    mean: [
      'Кожне замовлення доводиться купувати в рекламному аукціоні заново, бо власної бази й повторних продажів немає.',
      'Every order has to be bought in the ad auction all over again, because there is no owned base and no repeat sales.',
    ],
    fix: ['marketing', 'sales-channels', 'branding'],
  },
  {
    system: 'operations',
    mean: [
      'Гроші зникають уже після продажу: невикуп, повернення й дефіцит ходових позицій ніде не пораховані в гривнях.',
      'The money disappears after the sale: refused parcels, returns and stockouts on best sellers are never counted in money.',
    ],
    fix: ['automation', 'technology', 'data-growth'],
  },
  {
    system: 'data',
    mean: [
      'Рішення ухвалюються на відчуттях, бо звіти не сходяться ні між собою, ні з бухгалтерією.',
      'Decisions are made on gut feel, because the reports agree neither with each other nor with the books.',
    ],
    fix: ['data-growth', 'technology', 'automation'],
  },
  {
    system: 'org',
    mean: [
      'Бізнес не масштабується, бо кожне рішення досі проходить через власника.',
      'The business does not scale, because every decision still goes through the owner.',
    ],
    fix: ['automation', 'data-growth'],
  },
  {
    system: 'strategy',
    mean: [
      'Зростання є, але воно некероване: немає моделі росту й регулярного циклу план → факт → причини → дії.',
      'Growth happens, but nobody steers it: there is no growth model and no regular plan → actual → causes → actions cycle.',
    ],
    fix: ['branding', 'data-growth', 'marketing'],
  },
  {
    system: 'expansion',
    mean: [
      'Зростання впирається в стелю нинішнього ринку, а вихід у новий жодного разу не пораховано в грошах.',
      'Growth hits the ceiling of the current market, and entering a new one has never been costed in money.',
    ],
    fix: ['international', 'sales-channels', 'marketing'],
  },
];

export type SymptomView = {
  /** Симптом словами власника — поле `feel` системи. */
  say: string;
  mean: string;
  /** Куди ведемо за причиною. */
  systemPath: string;
  systemTitle: string;
  /** Чим лагодимо: підпис + адреса сторінки експертизи. */
  fix: { path: string; title: string }[];
};

/** Сценарії для показу. Порядок фіксований — від найчастішого болю до рідшого. */
export function symptomsFor(lang: 'uk' | 'en'): SymptomView[] {
  return SYMPTOMS.map((s) => {
    const sys = SYSTEMS.find((x) => x.key === s.system)!;
    const loc = localizeSystem(sys, lang);
    const systemPath = `/systems/${sys.slug}`;
    return {
      say: loc.feel,
      mean: s.mean[lang === 'en' ? 1 : 0],
      systemPath,
      systemTitle: nameOf(systemPath, lang) || loc.title,
      fix: s.fix.map((slug) => {
        const path = `/expansion/${slug}`;
        return { path, title: nameOf(path, lang) };
      }),
    };
  });
}
