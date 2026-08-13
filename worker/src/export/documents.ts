/**
 * Групування лінз у цілісні документи. Замість ~26 окремих PDF, кожен з яких
 * поодинці не тримає думку, — 5 тематичних розділів + один головний висновок.
 * Кілька аудитів зшиваються в ОДИН документ главами (chapter): читач не стрибає
 * між файлами по одному тезису.
 *
 * Ключ реалізації: композер не переписує рендерери — він бере ГОТОВИЙ HTML лінзи
 * (doc()-обгортка), вирізає її тіло (без власної обкладинки/підвалу/стилів-бази)
 * і вставляє главою під спільною обкладинкою розділу. Тому лінзи можна міняти й
 * перекладати незалежно — групування не ламається.
 */
import { doc, cover, chapter, pageFooter, conclusionSection, SHARED_CSS, CONSULT_CSS, esc } from './reportShell.js';

/** Лінза розділу: готовий HTML (з renderXHtml) + як підписати главу. */
export type Lens = { kicker: string; title: string; html: string };

/** Вирізати з повного doc()-HTML: додатковий CSS лінзи + тіло без обкладинки/підвалу. */
function lensParts(html: string): { extra: string; body: string } {
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
  // Прибираємо спільні шари стилів — вони додаються один раз на рівні розділу.
  const extra = style.split(SHARED_CSS).join('').split(CONSULT_CSS).join('');
  let body = html.match(/<body>([\s\S]*)<\/body>/i)?.[1] ?? html;
  body = body.replace(/<section class="cover"[\s\S]*?<\/section>/i, '');            // геть власну обкладинку
  body = body.replace(/<section class="block">\s*<div class="footer">[\s\S]*?<\/section>/gi, ''); // геть власний підвал
  return { extra: extra.trim(), body: body.trim() };
}

export type ThemeSpec = {
  file: string;                 // ім'я PDF
  kicker: string;               // напр. «Розділ 1 / 5»
  title: string;                // назва розділу (іменник)
  verdict?: string;             // висновок розділу однією фразою
  note?: string;                // рамка охоплення
  lenses: Lens[];               // глави
  conclusion?: string;          // готовий HTML підсумку (conclusionSection) або нічого
  footNote?: string;
};

/** Зібрати один тематичний документ із кількох лінз. */
export function composeTheme(t: ThemeSpec): { file: string; html: string } {
  const parts = t.lenses.filter((l) => l.html && l.html.length > 40).map((l) => {
    const { extra, body } = lensParts(l.html);
    return { extra, chap: chapter(l.title, l.kicker) + body };
  });
  const extraCss = Array.from(new Set(parts.map((p) => p.extra))).join('\n');
  const head = cover({ kicker: t.kicker, title: t.title, verdict: t.verdict, note: t.note });
  const body = head + parts.map((p) => p.chap).join('\n') + (t.conclusion ?? '') + pageFooter(t.footNote);
  return { file: t.file, html: doc(t.title, body, extraCss) };
}

/** Порожня лінза-заглушка (коли модель не зібралася) — щоб глава не з'являлась. */
export const emptyLens: Lens = { kicker: '', title: '', html: '' };
export const lens = (kicker: string, title: string, html: string | null | undefined): Lens =>
  html ? { kicker, title, html } : emptyLens;

/**
 * Побудувати весь клієнтський пакет з рендер-мапи лінз. Ключі — стабільні коди
 * лінз, значення — готовий HTML (або null, якщо крок пропущено). Повертає список
 * документів {file, html} для рендера в PDF.
 */
export type LensMap = Partial<Record<string, string | null>>;

export function buildClientDocuments(m: LensMap, opts: { verdicts?: Partial<Record<string, string>> } = {}): { file: string; html: string }[] {
  const v = opts.verdicts ?? {};
  const specs: ThemeSpec[] = [
    {
      file: '1-Головний-висновок.pdf', kicker: 'Розділ 1 / 5', title: 'Головний висновок',
      verdict: v.exec, note: 'Зведення всіх ліній аудиту в одну картину: де бізнес втрачає, що це коштує та з чого починати.',
      lenses: [
        lens('Executive', 'Виконавча діагностика', m.exec),
        lens('Синтез', 'Синтез: як лінзи пов’язані', m.synthesis),
        lens('Резюме', 'Підсумкове резюме: команда · строки · тактика', m.engagement),
      ],
      footNote: 'Зовнішній аудит вітрини. Відсутність даних не видається за факт і не приховується.',
    },
    {
      file: '2-Досвід-і-конверсія.pdf', kicker: 'Розділ 2 / 5', title: 'Досвід і конверсія',
      verdict: v.experience, note: 'Чи перетворює вітрина відвідувача на покупця: композиція сторінок проти еталона, шлях клієнта, контент і механіки конверсії.',
      lenses: [
        lens('UX/UI', 'Вітрина проти еталона — поблочно', m.uxui),
        lens('Шлях клієнта', 'Карта шляху клієнта', m.journey),
        lens('Контент', 'Контент: чи веде до рішення', m.content),
        lens('Механіки', 'Маркетингові механіки', m.mechanics),
      ],
      footNote: 'Оцінки — спостереження за зовнішнім обходом; вплив на виручку підтверджується після підключення аналітики.',
    },
    {
      file: '3-Трафік-і-видимість.pdf', kicker: 'Розділ 3 / 5', title: 'Трафік і видимість',
      verdict: v.traffic, note: 'Чи можуть вас знайти й чи довіряють: технічний фундамент, SEO-архітектура, канали, соцмережі, відгуки та зовнішній інфофон.',
      lenses: [
        lens('SEO', 'SEO-архітектура', m.seo),
        lens('Техніка', 'Технічний фундамент', m.tech),
        lens('Канали', 'Аудит каналів', m.channels),
        lens('Соцмережі', 'Аудит соцмереж', m.social),
        lens('Відгуки', 'Аудит відгуків', m.reviews),
        lens('Інфофон', 'Зовнішній інфофон', m.mentions),
      ],
      footNote: 'Частина сигналів закривається зовнішніми сервісами (позиції, backlinks, CWV) на наступному етапі.',
    },
    {
      file: '4-Бізнес-і-ринок.pdf', kicker: 'Розділ 4 / 5', title: 'Бізнес і ринок',
      verdict: v.business, note: 'Де ви стоїте комерційно: реконструкція бізнесу з вітрини, зрілість, конкурентне поле й ціна в каналі.',
      lenses: [
        lens('Intelligence', 'Commerce Intelligence', m.intelligence),
        lens('Зрілість', 'Матриця зрілості', m.maturity),
        lens('Конкуренти', 'Конкурентний аналіз', m.competitor),
        lens('Ціна', 'Ціна в каналі та реселери', m.pricechannel),
      ],
      footNote: 'Юніт-економіка й маржа уточнюються після передачі доступів (baseline, вивантаження).',
    },
    {
      file: '5-План-дій.pdf', kicker: 'Розділ 5 / 5', title: 'План дій',
      verdict: v.plan, note: 'Що робити: причина → пріоритет → гроші → черга робіт. Причинна карта, реєстр знахідок і зведений беклог в одному документі.',
      lenses: [
        lens('Причини', 'Причинно-наслідкова карта', m.causal),
        lens('Знахідки', 'Реєстр знахідок', m.registry),
        lens('Беклог', 'Зведений беклог', m.backlog),
      ],
      footNote: 'Пріоритет — за близькістю до грошей і вартістю впровадження. Суми уточнюються на наступному етапі.',
    },
  ];
  // Прем'єра: якщо є преміум-експертиза — додаємо главою в «План дій».
  if (m.premium) specs[4].lenses.push(lens('Експертиза', 'Преміум-експертиза', m.premium));

  return specs.map(composeTheme).filter((d) => d.html.length > 200);
}

/** Ярлик підсумку розділу для composeTheme.conclusion. */
export function themeConclusion(paras: string[], next?: string): string {
  return conclusionSection(paras, next);
}
