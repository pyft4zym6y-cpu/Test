/**
 * Вайрфрейм-скелети блоків для UX/UI-звіту: візуальне «ЗАРАЗ ↔ ЯК ТРЕБА» по
 * кожному блоку, як в еталоні (blocks_wireframe / hub_wireframe). Відповідає на
 * питання не «чи є блок», а «яким він має бути». Якщо блока немає — показуємо,
 * яким він мав би бути. Чисті HTML/CSS-скелети (сірі плейсхолдери + підписи),
 * друкуються в PDF без зовнішніх залежностей.
 *
 * ЯК ТРЕБА — з еталонної композиції (spec-driven, однаковий для будь-якого сайту
 * цього типу). ЗАРАЗ — деградований скелет за станом блока (є-слабко/немає) +
 * фактичне спостереження обходу.
 */
import type { BlockRow, BlockState } from '../pagereport.js';

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/* ── Примітиви скелета ── */
const box = (label = '', cls = '') => `<div class="wf-box ${cls}">${label ? `<span>${esc(label)}</span>` : ''}</div>`;
const line = (w = 100) => `<i class="wf-line" style="width:${w}%"></i>`;
const chip = (t: string, on = false) => `<span class="wf-chip ${on ? 'on' : ''}">${esc(t)}</span>`;
const card = (title: string, lines: number, link?: string) =>
  `<div class="wf-card"><b>${esc(title)}</b>${Array.from({ length: lines }, () => line(90 - Math.random() * 20 | 0)).join('')}${link ? `<u>${esc(link)}</u>` : ''}</div>`;
const row = (inner: string, cls = '') => `<div class="wf-row ${cls}">${inner}</div>`;

/**
 * «ЯК ТРЕБА» — еталонний скелет за ключем блока. Для більшості комерційних блоків
 * дає осмислену композицію; для решти — акуратний дженерик (заголовок + вміст).
 */
function idealSkeleton(key: string): string {
  switch (key) {
    case 'nav':
      return row(`${box('☰ Каталог', 'wf-dark')}${chip('Акції')}${chip('Бренди')}${chip('Новинки')}${chip('Рішення')}${chip('Сервіс')}${chip('Sale', true)}`, 'wf-wrap');
    case 'search':
      return `<div class="wf-search">${box('🔍', 'wf-sq')}<i class="wf-line" style="width:70%"></i><span class="wf-hint">підказки · толерантність до одруківок</span></div>`;
    case 'hero':
      return `<div class="wf-hero">${box('Один головний оффер (не карусель із 5 банерів)', 'wf-hero-b')}<div class="wf-cta">${box('Головний CTA', 'wf-dark wf-cta-b')}</div></div>`;
    case 'usp_bar':
      return row(`${card('Власне виробництво', 1)}${card('Доставка 1–2 дні', 1)}${card('Повернення 14 днів', 1)}${card('Гарантія', 1)}`, 'wf-4');
    case 'trust':
      return row(`${card('Тільки офіційні товари', 2, 'Докладніше →')}${card('Гарантія', 2, 'Умови →')}${card('Оплата й доставка', 2, 'Способи →')}${card('Повернення 14 днів', 2, 'Як повернути →')}`, 'wf-4');
    case 'product_grid':
      return row(`${card('▢ фото · ціна · ★', 1)}${card('▢ фото · ціна · ★', 1)}${card('▢ фото · ціна · ★', 1)}${card('▢ фото · ціна · ★', 1)}`, 'wf-4') + `<span class="wf-hint">керована добірка: бестселери / новинки / сезон</span>`;
    case 'reviews':
      return row(`${card('★★★★★ · фото покупця', 2)}${card('★★★★☆ · підтв. покупка', 2)}${card('відповідь бренду', 2)}`, 'wf-3');
    case 'newsletter':
      return `<div class="wf-news">${box('Цінність (гайд/–15%)', 'wf-news-v')}<i class="wf-line" style="width:60%"></i>${box('Підписатися', 'wf-dark wf-sm')}</div>`;
    case 'footer_contacts':
      return row(`${card('Юрособа · адреса · тел.', 3)}${card('Оплата й доставка', 2)}${card('Правові сторінки', 2)}${card('Соцмережі', 1)}`, 'wf-4');
    case 'breadcrumbs':
      return row(`${chip('Головна')}<span class="wf-sep">›</span>${chip('Категорія')}<span class="wf-sep">›</span>${chip('Підкатегорія')}`, 'wf-wrap');
    case 'category_title': case 'product_header':
      return `<div>${box('H1 з предметом (не «Каталог»)', 'wf-h1')}<i class="wf-line" style="width:40%"></i></div>`;
    case 'filters':
      return `<div class="wf-split"><div class="wf-side">${box('Ціна', 'wf-sm')}${box('Бренд', 'wf-sm')}${box('Розмір', 'wf-sm')}${box('Колір', 'wf-sm')}<span class="wf-hint">лічильники · скидання</span></div><div class="wf-main">${row(`${box('▢')}${box('▢')}${box('▢')}`, 'wf-3')}</div></div>`;
    case 'gallery':
      return `<div class="wf-split"><div class="wf-side">${box('▤')}${box('▤')}${box('▤')}${box('▶ відео')}${box('фото покупців')}</div><div class="wf-main">${box('Головне фото (зум)', 'wf-gal')}</div></div>`;
    case 'price':
      return `<div>${box('Ціна одразу · стара ціна чесна', 'wf-price')}<span class="wf-hint">наявність і термін — поруч, до кнопки</span></div>`;
    case 'add_to_cart':
      return `<div>${box('До кошика', 'wf-dark wf-cta-b')}<span class="wf-hint">мікро-довіра ПІД кнопкою: повернення · гарантія · оплата</span></div>`;
    case 'variants':
      return row(`${chip('S')}${chip('M', true)}${chip('L')}${chip('XL')}<span class="wf-hint">недоступні перекреслені, не приховані</span>`, 'wf-wrap');
    case 'delivery': case 'delivery_calc': case 'delivery_selection':
      return row(`${card('Відділення', 1)}${card('Поштомат', 1)}${card('Курʼєр', 1)}`, 'wf-3') + `<span class="wf-hint">ціна й термін — до кошика</span>`;
    case 'faq': case 'qa':
      return `<div>${box('▸ Питання вибору цієї категорії', 'wf-acc')}${box('▸ Питання про доставку/оплату', 'wf-acc')}<span class="wf-hint">самодостатня відповідь 40–60 слів + FAQPage-розмітка</span></div>`;
    case 'related':
      return row(`${card('Інші кольори', 1)}${card('З цим беруть', 1)}${card('Схожі', 1)}`, 'wf-3');
    case 'order_summary':
      return `<div class="wf-sum">${line(80)}${line(70)}${line(60)}${box('Разом до сплати', 'wf-total')}<span class="wf-hint">без витрат, що спливають пізніше</span></div>`;
    default:
      return `<div>${box('', 'wf-h1')}${line(90)}${line(75)}${line(60)}</div>`;
  }
}

/** «ЗАРАЗ» — деградований скелет за станом: немає / є-слабко / за еталоном. */
function currentSkeleton(row0: BlockRow): string {
  if (row0.state === 'gap') return `<div class="wf-empty">Блоку немає</div>`;
  if (row0.state === 'check') return `<div class="wf-empty wf-hidden">Не підтверджено обходом<br><span>можливо за табом / JS</span></div>`;
  // present (ok/weak): показуємо спрощений/плаский варіант
  if (row0.state === 'weak') {
    // типова «шаблонна» деградація за ключем
    switch (row0.key) {
      case 'trust': case 'usp_bar':
        return row(`${box('▢ 2 слова')}${box('▢ 2 слова')}${box('▢ 2 слова')}${box('▢ 2 слова')}`, 'wf-4') + `<span class="wf-hint wf-bad">іконка + 2 слова, без відповіді й посилань</span>`;
      case 'product_grid':
        return row(`${box('▢')}${box('▢')}`, 'wf-2') + `<span class="wf-hint wf-bad">2–3 випадкові товари</span>`;
      case 'gallery':
        return `<div class="wf-main">${box('1–2 фото', 'wf-gal')}</div><span class="wf-hint wf-bad">тонша за 5 типів медіа</span>`;
      case 'add_to_cart':
        return `<div>${box('Купити', 'wf-cta-b')}${box('Купити 1-клік', 'wf-cta-b')}${box('Оптом', 'wf-cta-b')}<span class="wf-hint wf-bad">пріоритет CTA розмито</span></div>`;
      default:
        return `<div>${box('', 'wf-h1')}${line(70)}<span class="wf-hint wf-bad">є, але не за еталоном</span></div>`;
    }
  }
  // ok — присутній і за еталоном: показуємо коротко «як треба»
  return `<div class="wf-okmini">${idealSkeleton(row0.key)}</div>`;
}

const STATE_TAG: Record<BlockState, { t: string; c: string }> = {
  ok: { t: 'ЗА ЕТАЛОНОМ', c: 'ok' }, weak: { t: 'Є, АЛЕ СЛАБКО', c: 'weak' },
  check: { t: 'ПРИХОВАНО', c: 'check' }, gap: { t: 'БЛОКА НЕМАЄ', c: 'gap' },
};

/** Карточка блока: ЗАРАЗ ↔ ЯК ТРЕБА зі скелетами + вердикт (як в еталоні). */
const PRI_CLS: Record<string, string> = { P0: 'gap', P1: 'weak', P2: 'check', P3: 'ok' };
const stars = (v: number) => `<span class="wfa-stars" style="--v:${v}"><i></i></span>`;

/** Анатомія оцінки блока (Fragstore-стиль): проблема · осі · рекомендація · пріоритет · ефект. */
function auditPanel(r: BlockRow): string {
  if (r.state === 'ok' || !r.axes?.length) return '';
  const axes = r.axes.map((a) => `<div class="wfa-axis"><span class="wfa-ax-l">${esc(a.label)}</span>${stars(a.score)}<b>${a.score.toFixed(1)}</b></div>`).join('');
  const links = r.internalLinks?.length ? `<div class="wfa-links"><b>Внутрішні посилання:</b> ${r.internalLinks.map(esc).join(' · ')}</div>` : '';
  const impact = (r.impact ?? []).map((t) => `<span class="wfa-tag">${esc(t)}</span>`).join('');
  const height = r.heightHint ? `<span class="wfa-h">${esc(r.heightHint)}</span>` : '';
  return `<div class="wfc-audit">
    <div class="wfa-cols">
      <div class="wfa-score-box">
        <div class="wfa-cap">UX/UI/CRO-оцінка</div>
        ${axes}
        <div class="wfa-overall">Підсумок <b>${(r.overall ?? 0).toFixed(1)}</b><i>/5</i></div>
      </div>
      <div class="wfa-reco-box">
        <div class="wfa-line"><span class="wfa-lbl">Проблема</span><span>${esc(r.problem ?? '')}</span></div>
        <div class="wfa-line"><span class="wfa-lbl">Рекомендація</span><span>${esc(r.recommendation ?? '')}</span></div>
        ${links}
        <div class="wfa-meta"><span class="wfa-pri ${PRI_CLS[r.priority ?? 'P3']}">${esc(r.priority ?? '')}</span>${impact}${height}</div>
        <div class="wfa-line"><span class="wfa-lbl">Ефект</span><span class="wfa-eff">${esc(r.effect ?? '')}</span></div>
      </div>
    </div>
  </div>`;
}

export function blockCard(row0: BlockRow, i: number): string {
  const tag = STATE_TAG[row0.state];
  const showBoth = row0.state !== 'ok'; // якщо все за еталоном — не дублюємо
  return `<div class="wfc">
    <div class="wfc-head"><span class="wfc-n">${String(i + 1).padStart(2, '0')}</span><b>${esc(row0.name)}</b>
      <span class="wfc-tag ${tag.c}">${tag.t}</span><span class="wfc-score ${tag.c}">${row0.score}/${row0.max}</span></div>
    <div class="wfc-body ${showBoth ? '' : 'wfc-one'}">
      ${showBoth ? `<div class="wfc-col wfc-now"><div class="wfc-lbl">ЗАРАЗ</div>${currentSkeleton(row0)}<p class="wfc-note">${esc(row0.now)}</p></div>` : ''}
      <div class="wfc-col wfc-should"><div class="wfc-lbl good">ЯК ТРЕБА</div>${idealSkeleton(row0.key)}<p class="wfc-note">${esc(row0.should)}</p></div>
    </div>
    ${auditPanel(row0)}
  </div>`;
}

/** CSS вайрфреймів — підключається один раз у EXTRA_CSS звіту. */
export const WIREFRAME_CSS = `
  .wfc{border:1px solid var(--line);border-radius:7px;margin:8px 0;overflow:hidden;page-break-inside:avoid;}
  .wfc-head{display:flex;align-items:center;gap:7px;padding:6px 9px;background:var(--soft);border-bottom:1px solid var(--line);}
  .wfc-n{font-weight:800;color:var(--lime);font-size:10px;} .wfc-head b{font-size:11px;flex:0 0 auto;}
  .wfc-tag{font-size:7.5px;font-weight:800;letter-spacing:.4px;padding:1px 6px;border-radius:10px;margin-left:4px;}
  .wfc-tag.ok{background:#e7f6ec;color:var(--ok);} .wfc-tag.weak{background:#fdeee4;color:var(--weak);}
  .wfc-tag.check{background:#fdf6e7;color:var(--check);} .wfc-tag.gap{background:#fdeaea;color:var(--gap);}
  .wfc-score{margin-left:auto;font-weight:800;font-size:11px;} .wfc-score.ok{color:var(--ok);} .wfc-score.weak{color:var(--weak);} .wfc-score.check{color:var(--check);} .wfc-score.gap{color:var(--gap);}
  .wfc-body{display:grid;grid-template-columns:1fr 1fr;gap:0;} .wfc-body.wfc-one{grid-template-columns:1fr;}
  .wfc-col{padding:9px 11px;} .wfc-now{border-right:1px solid var(--line);background:#fcfcfc;}
  .wfc-lbl{font-size:8px;font-weight:800;letter-spacing:.5px;color:var(--muted);margin-bottom:6px;} .wfc-lbl.good{color:var(--ok);}
  .wfc-note{font-size:8.5px;line-height:1.35;color:#444;margin:7px 0 0;}
  /* примітиви */
  .wf-box{background:#eceef1;border:1px solid #dfe3e8;border-radius:4px;min-height:22px;display:flex;align-items:center;justify-content:center;padding:3px 6px;flex:1;}
  .wf-box span{font-size:8px;color:#6b7280;text-align:center;line-height:1.2;}
  .wf-dark{background:#2b2f36;border-color:#2b2f36;} .wf-dark span{color:#fff;}
  .wf-line{display:block;height:5px;background:#e2e5ea;border-radius:3px;margin:4px 0;}
  .wf-chip{display:inline-block;font-size:8px;padding:2px 7px;border:1px solid #dfe3e8;border-radius:12px;background:#fff;color:#4b5563;margin:2px 3px 2px 0;}
  .wf-chip.on{background:#2b2f36;color:#fff;border-color:#2b2f36;}
  .wf-card{border:1px solid #dfe3e8;border-radius:4px;padding:6px;background:#fff;flex:1;min-width:0;}
  .wf-card b{font-size:8px;display:block;margin-bottom:3px;color:#374151;} .wf-card u{font-size:7.5px;color:var(--lime);display:block;margin-top:3px;text-decoration:none;}
  .wf-row{display:flex;gap:6px;align-items:stretch;} .wf-row.wf-wrap{flex-wrap:wrap;} .wf-row.wf-2>*{flex:1;} .wf-row.wf-3>*{flex:1;} .wf-row.wf-4>*{flex:1;}
  .wf-hint{display:block;font-size:7.5px;color:#9ca3af;margin-top:5px;font-style:italic;} .wf-hint.wf-bad{color:var(--weak);font-style:normal;font-weight:600;}
  .wf-search{display:flex;align-items:center;gap:6px;} .wf-sq{flex:0 0 26px;min-height:26px;} .wf-search .wf-line{margin:0;height:26px;border-radius:4px;background:#eceef1;}
  .wf-hero-b{min-height:54px;} .wf-cta{margin-top:6px;} .wf-cta-b{min-height:26px;flex:0 0 auto;display:inline-flex;padding:4px 14px;margin-right:5px;}
  .wf-hero{display:block;} .wf-sep{color:#c0c5cc;font-size:9px;margin:0 2px;}
  .wf-news{display:flex;align-items:center;gap:6px;} .wf-news-v{flex:1;} .wf-sm{flex:0 0 auto;min-height:24px;padding:3px 10px;}
  .wf-split{display:flex;gap:8px;} .wf-side{flex:0 0 34%;} .wf-main{flex:1;} .wf-side .wf-box{margin:3px 0;}
  .wf-gal{min-height:60px;} .wf-h1{min-height:20px;background:#e2e5ea;} .wf-price{min-height:24px;background:#e9edf3;}
  .wf-acc{min-height:20px;margin:3px 0;justify-content:flex-start;} .wf-total{background:#2b2f36;} .wf-total span{color:#fff;}
  .wf-sum .wf-line{background:#e2e5ea;} .wf-empty{border:1px dashed var(--gap);border-radius:5px;color:var(--gap);text-align:center;padding:16px 8px;font-size:9px;font-weight:700;}
  .wf-empty.wf-hidden{border-color:var(--check);color:var(--check);} .wf-empty span{font-weight:400;font-size:8px;}
  .wf-okmini{opacity:.85;}
  /* ── Анатомія оцінки блока (Fragstore-стиль) ── */
  .wfc-audit{border-top:1px solid #eceef1;margin-top:8px;padding-top:8px;}
  .wfa-cols{display:flex;gap:12px;align-items:flex-start;}
  .wfa-score-box{flex:0 0 190px;border:1px solid #eceef1;border-radius:6px;padding:8px 10px;background:#fafbfc;}
  .wfa-reco-box{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}
  .wfa-cap{font-size:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#9ca3af;margin-bottom:5px;}
  .wfa-axis{display:flex;align-items:center;gap:6px;margin:2px 0;font-size:8.5px;}
  .wfa-ax-l{flex:1;color:#4b5563;}
  .wfa-axis b{font-size:8.5px;color:#374151;width:20px;text-align:right;}
  .wfa-stars{--v:0;position:relative;display:inline-block;font-size:9px;line-height:1;color:#dcdfe4;letter-spacing:.5px;white-space:nowrap;}
  .wfa-stars::before{content:'★★★★★';}
  .wfa-stars i{position:absolute;left:0;top:0;overflow:hidden;color:#f5a623;width:calc(var(--v) / 5 * 100%);}
  .wfa-stars i::before{content:'★★★★★';}
  .wfa-overall{margin-top:6px;padding-top:5px;border-top:1px solid #eceef1;font-size:9px;color:#6b7280;}
  .wfa-overall b{font-size:15px;color:#111827;font-weight:800;} .wfa-overall i{font-style:normal;color:#9ca3af;font-size:10px;}
  .wfa-line{display:flex;gap:7px;font-size:9px;line-height:1.4;}
  .wfa-lbl{flex:0 0 78px;color:#9ca3af;font-weight:700;}
  .wfa-line span:last-child{color:#1f2937;}
  .wfa-eff{color:#16a34a !important;font-weight:600;}
  .wfa-links{font-size:8.5px;color:#4b5563;} .wfa-links b{color:#6b7280;}
  .wfa-meta{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:1px 0;}
  .wfa-pri{font-size:8px;font-weight:800;color:#fff;padding:2px 8px;border-radius:12px;}
  .wfa-pri.gap{background:#dc2626;} .wfa-pri.weak{background:#ea580c;} .wfa-pri.check{background:#d97706;} .wfa-pri.ok{background:#16a34a;}
  .wfa-tag{font-size:8px;color:#374151;background:#eef1f5;border:1px solid #dfe3e8;border-radius:12px;padding:2px 8px;}
  .wfa-h{font-size:8px;color:#2f4fd0;background:#eef2ff;border:1px solid #c9d4ff;border-radius:12px;padding:2px 8px;font-weight:700;}
`;
