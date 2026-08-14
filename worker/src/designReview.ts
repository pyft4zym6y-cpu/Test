/**
 * Дизайн-ревʼю зі ЗОРОМ. Головна претензія до попереднього аудиту: він міряв
 * наявність блоків, але жодного разу не ПОДИВИВСЯ на сторінку — красиво це чи
 * ні, кастом це чи куплений шаблон на дірявому WordPress. Тут Claude як
 * senior design director дивиться на скріншоти перших екранів + відбиток стека
 * і дає чесний вкусовий вердикт за стандартами (web-design-guidelines, дисципліна
 * ієрархії/типографіки/ритму) + прапорці «шаблонність / датованість / AI-slop».
 *
 * Без ключа — детермінований fallback з відбитка стека й дизайн-замірів обходу
 * (комерційний шаблон + білдер + розмиті сигнали → «типовий шаблон»), без імітації.
 */
import { createMessage, hasKey, extractJson, apiErrorHint } from './anthropic.js';
import type { SiteCrawl, PageAudit, StackFingerprint } from './crawl.js';

export type DesignAxis = { name: string; score: number; note: string }; // 0..10
export type PageDesign = { title: string; url: string; score: number; verdict: string; tells: string[] };
export type DesignReview = {
  client: string;
  source: 'зір' | 'детермінований';
  tier: 'кастомна дизайн-система' | 'преміум-шаблон, доопрацьований' | 'типовий готовий шаблон' | 'застарілий шаблон-костиль';
  overallScore: number;        // 0..10 — «наскільки це виглядає дорого/сучасно»
  verdict: string;             // 2–3 речення: красиво/дешево, чому саме
  axes: DesignAxis[];          // ієрархія, типографіка, колір, ритм/сітка, зображення, консистентність
  templateTells: string[];     // улики шаблонності/датованості/костильності
  references: string[];        // як виглядає «дорого» — архетипи/орієнтири
  perPage: PageDesign[];
  stackLine: string;           // одним рядком: на чому зібрано
};

const AXES = ['Візуальна ієрархія', 'Типографіка', 'Колір і контраст', 'Сітка й ритм', 'Робота із зображеннями', 'Консистентність'];

/** Одна лінія «на чём собрано» з відбитка стека — для шапки вердикту. */
export function stackLine(s?: StackFingerprint | null): string {
  if (!s) return 'Стек не розпізнано з розмітки.';
  const bits: string[] = [];
  if (s.cms) bits.push(s.cms + (s.cmsVersion ? ` ${s.cmsVersion}` : ''));
  if (s.templateName) bits.push(`тема «${s.templateName}» (комерційний шаблон)`);
  else if (s.theme) bits.push(`тема «${s.theme}»`);
  if (s.builder) bits.push(`білдер ${s.builder}`);
  if (s.plugins.length) bits.push(`${s.plugins.length} плагінів`);
  return bits.join(' · ') || 'Стек не розпізнано з розмітки.';
}

/** Детермінований вердикт з відбитка стека + дизайн-замірів (без ключа/зору). */
function deterministic(client: string, site: SiteCrawl): DesignReview {
  const s = site.stack;
  const home = site.pages.find((p) => p.kind === 'home' && !p.error) ?? site.pages.find((p) => !p.error);
  const ux = home?.ux;
  const tells: string[] = [...(s?.signals ?? [])];
  if (ux) {
    if (ux.distinctButtonColors > 4) tells.push(`${ux.distinctButtonColors} кольорів кнопок у першому екрані — немає дисципліни акценту (ознака зборки «як лягло з теми»)`);
    if (ux.headingLevels <= 2) tells.push('пласка типографічна ієрархія (≤2 рівні заголовків) — усе одного «ваги»');
    if (ux.foldButtons > 10) tells.push(`${ux.foldButtons} клікабельних над згином — перший екран без фокусу`);
    if (ux.baseFontPx && ux.baseFontPx < 15) tells.push(`базовий кегль ${ux.baseFontPx}px — дрібний, «шаблонний» текст`);
  }
  let tier: DesignReview['tier'] = 'типовий готовий шаблон';
  let score = 5;
  if (s?.signals?.some((x) => /застаріла|костил/i.test(x))) { tier = 'застарілий шаблон-костиль'; score = 3; }
  else if (s?.commercialTemplate && s.builder) { tier = 'преміум-шаблон, доопрацьований'; score = 5; }
  else if (s?.builder && /Elementor|WPBakery|Divi|Avada/.test(s.builder)) { tier = 'типовий готовий шаблон'; score = 4; }
  const verdict = `${site.stack?.cms ? `Це ${stackLine(s)}. ` : ''}Візуально — ${tier}. ${tells.length ? 'Оформлення тримається на готовій темі й візуальному білдері: блоки — стокові пресети, а не власна дизайн-система, тому вітрина виглядає як тисячі однакових.' : 'Ознак кастомної дизайн-системи в розмітці не видно.'} Оцінка приблизна: аналітичний шар зі зором недоступний (немає ключа) — після підключення оцінюється покадрово.`;
  return {
    client, source: 'детермінований', tier, overallScore: score, verdict,
    axes: AXES.map((name) => ({ name, score, note: 'оцінка зі зором недоступна — детермінований наближений бал' })),
    templateTells: tells.slice(0, 8),
    references: ['Кастомна дизайн-система з чіткою типографічною шкалою й одним акцентом', 'Сучасні e-commerce-вітрини рівня преміум-ніші (власна сітка, повітря, фотоконтент однієї якості)'],
    perPage: site.pages.filter((p) => !p.error).slice(0, 6).map((p) => ({ title: p.title || p.kind, url: p.finalUrl || p.url, score, verdict: 'детермінований бал (без зору)', tells: [] })),
    stackLine: stackLine(s),
  };
}

const SYSTEM = `Ти — senior design director рівня C-level (агентство преміум e-commerce). Тобі дають СКРІНШОТИ перших екранів сторінок сайту та відбиток технічного стека. Твоє завдання — чесний ВКУСОВИЙ вердикт: це дорого й сучасно чи дешевий готовий шаблон.

Дивись як дизайнер, не як чек-лист. Оцінюй: візуальну ієрархію (чи є один герой), типографіку (шкала, гарнітури, ритм), колір і контраст (дисципліна акценту чи «веселка»), сітку й повітря, роботу із зображеннями (єдина якість фото чи стокова каша), консистентність. Розпізнавай ознаки ШАБЛОННОСТІ: стокові слайдери-каруселі, іконки-пресети теми, кнопки різних кольорів, датований градієнт/тінь/скруглення, демо-контент, «зборка на білдері». Прямо називай, якщо це виглядає як куплена ThemeForest-тема на WordPress.

Правила:
- Тільки за тим, що видно на скріншотах + стек. Не вигадуй те, чого не видно.
- Тон — прямий, професійний, без «загалом непогано». Якщо дешево — скажи чому саме.
- Українською.

Поверни СТРОГО JSON:
{
  "tier": "кастомна дизайн-система|преміум-шаблон, доопрацьований|типовий готовий шаблон|застарілий шаблон-костиль",
  "overallScore": <0..10 — наскільки виглядає дорого/сучасно>,
  "verdict": "2–3 речення: красиво чи дешево і чому саме, з прямою згадкою платформи/шаблону якщо це видно",
  "axes": [{"name":"Візуальна ієрархія|Типографіка|Колір і контраст|Сітка й ритм|Робота із зображеннями|Консистентність","score":<0..10>,"note":"що саме не так/добре"}],
  "templateTells": ["конкретні улики шаблонності/датованості/костильності — те, що видно"],
  "references": ["як мало б виглядати «дорого» — 2-3 орієнтири/архетипи"],
  "perPage": [{"title":"...","url":"...","score":<0..10>,"verdict":"1 речення","tells":["..."]}]
}`;

/** Дизайн-ревʼю зі зором: Claude дивиться на скріншоти й дає вкусовий вердикт. */
export async function reviewDesign(site: SiteCrawl, log?: (m: string) => void): Promise<DesignReview | null> {
  let client = site.finalUrl;
  try { client = new URL(site.finalUrl).hostname.replace(/^www\./, ''); } catch { /* noop */ }
  const shots = site.pages.filter((p) => !p.error && p.screenshot).slice(0, 5);
  if (!hasKey() || !shots.length) {
    if (!site.pages.some((p) => !p.error)) return null;
    return deterministic(client, site);
  }
  try {
    const content: any[] = [{
      type: 'text',
      text: `Клієнт: ${client}. Стек із розмітки: ${stackLine(site.stack)}.${site.stack?.signals?.length ? ` Технічні улики: ${site.stack.signals.join('; ')}.` : ''}\n\nНижче — скріншоти перших екранів (${shots.length}). Подивись на них як дизайн-директор і збери JSON. perPage — по одному обʼєкту на кожен наданий скріншот у тому ж порядку.`,
    }];
    for (const p of shots) {
      content.push({ type: 'text', text: `\n[${p.title || p.kind}] ${p.finalUrl || p.url}` });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.screenshot } });
    }
    const resp: any = await createMessage({ max_tokens: 4000, system: SYSTEM, messages: [{ role: 'user', content }] });
    const text = (resp.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const r = extractJson<Omit<DesignReview, 'client' | 'source' | 'stackLine'>>(text);
    if (!r || typeof r.overallScore !== 'number') return deterministic(client, site);
    return {
      client, source: 'зір', tier: r.tier, overallScore: r.overallScore, verdict: r.verdict,
      axes: Array.isArray(r.axes) ? r.axes : [], templateTells: Array.isArray(r.templateTells) ? r.templateTells : [],
      references: Array.isArray(r.references) ? r.references : [], perPage: Array.isArray(r.perPage) ? r.perPage : [],
      stackLine: stackLine(site.stack),
    };
  } catch (e) {
    log?.(`⚠️ дизайн-ревʼю зі зором не відпрацювало (${String(e).slice(0, 90)})${apiErrorHint(e)}`);
    return deterministic(client, site);
  }
}
