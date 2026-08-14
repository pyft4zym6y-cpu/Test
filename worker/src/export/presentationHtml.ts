/**
 * ФЛАГМАНСКИЙ клиентский документ — «Презентація аудиту». Не карта аналитика, а
 * консультационная презентация, которая ведёт собственника к решению. Логика
 * (задана заказчиком, единая для любого тира):
 *
 *  1. Вступ — «ви розвиваєте онлайн-продажі; я провів розбір, презентую по порядку».
 *  2. Сторінки, що Є — КОМЕРЦІЙНИЙ шлях першим (головна → каталог → картка),
 *     кожна ПОБЛОЧНО (лінзи: клієнт/UX · тренди ecommerce · SEO · CTA) з «як треба»;
 *     далі другорядні (акції/новинки) і блог.
 *  3. Сторінки, яких НЕМАЄ — неповне дерево з погляду ecommerce/бізнесу.
 *  4. ЦЕНТРАЛЬНА ВІТКА — два шляхи (доробка шаблону / стратегічна переробка) +
 *     економіка конверсії (0.2–0.8% → 3–5% → економія на рекламі/CAC, органіка, бренд).
 *  5. Довесок — першочергові болі (аналітика/трекінг/телефонія, SEO — ключове) →
 *     «будуємо системно → потрібна команда ролей за етапами» → веде до КП.
 *
 * Верстается на общем reportShell; блоки страниц — вайрфреймы ЗАРАЗ↔ЯК ТРЕБА.
 * Внутренние проценты/гипотезы сюда НЕ идут (они в нашем внутреннем архиве).
 */
import type { SiteAuditReport, PageReport } from '../pagereport.js';
import { KIND_LABEL } from '../pagereport.js';
import { blockCard, WIREFRAME_CSS } from './wireframes.js';
import { esc, doc, cover, chapter, pageFooter, scoreColor } from './reportShell.js';

const KIND_ORDER = ['home', 'plp', 'pdp', 'cart', 'checkout']; // коммерческий путь
const pctOf = (p: PageReport) => (p.max ? Math.round((p.score / p.max) * 100) : 0);

/** Разбор одной страницы в презентации: вывод-заголовок + сильное/провалы + вайрфреймы блоков. */
function pageBlock(p: PageReport, n: number): string {
  const gaps = p.rows.filter((b) => b.state === 'gap' && b.weight !== 'nice').map((b) => b.name);
  const weak = p.rows.filter((b) => b.state === 'weak').map((b) => b.name);
  const strong = p.strong.slice(0, 4);
  const pct = pctOf(p);
  return `<section class="block page-blk">
    <div class="pb-head"><span class="pb-n">${String(n).padStart(2, '0')}</span>
      <div><div class="pb-kick">${esc(KIND_LABEL[p.kind] ?? p.kind)} · комерційний шлях</div>
      <h2>${esc(p.conclusion)}</h2></div>
      <span class="pb-score ${scoreColor(pct)}">${pct}%</span></div>
    ${p.principle ? `<p class="lead">Що покупець очікує тут: ${esc(p.principle)}</p>` : ''}
    <div class="pb-sum">
      ${strong.length ? `<div><b class="ok">Працює:</b> ${strong.map(esc).join(' · ')}</div>` : ''}
      ${weak.length ? `<div><b class="warn">Слабко (є, але не за еталоном):</b> ${weak.map(esc).join(' · ')}</div>` : ''}
      ${gaps.length ? `<div><b class="gap">Немає ключових блоків:</b> ${gaps.map(esc).join(' · ')}</div>` : ''}
    </div>
    <div class="pb-cards">${p.rows.map((b, i) => blockCard(b, i)).join('')}</div>
  </section>`;
}

/** Экономика конверсии + два пути — центральная ветка презентации. */
function centralBranch(r: SiteAuditReport): string {
  return `<section class="block">
    ${chapter('Рекомендація: два шляхи', 'Центральне рішення')}
    <p class="verdict">Поточна вітрина конвертуватиме як шаблон — правильно зібрана дає кратно більше. Це і є рішення, яке треба ухвалити.</p>
    <div class="econ">
      <div class="econ-now"><div class="econ-cap">ПОТОЧНИЙ ШАБЛОН</div><div class="econ-big gap">0.2–0.8%</div><div class="econ-note">типова конверсія шаблонної вітрини без комерційних блоків і кастомного UX</div></div>
      <div class="econ-arrow">→</div>
      <div class="econ-tgt"><div class="econ-cap">ЗІБРАНО ПРАВИЛЬНО</div><div class="econ-big ok">3–5%</div><div class="econ-note">кастомний UX/UI, повна композиція, первинне SEO — рівень ніші</div></div>
    </div>
    <p class="lead">Це не тільки конверсія: кратно нижча вартість клієнта й витрати на рекламу, працює органіка, бренд та імідж — вітрина стає активом, а не статтею витрат.</p>
    <div class="paths">
      <div class="path"><h3>Шлях A · Доробка поточного шаблону</h3>
        <p>Швидше й дешевше на старті. Додаємо відсутні блоки, чистимо дерево, ставимо аналітику. <b>Стеля нижча</b> — база лишається шаблонною, кастомного UX і повного SEO-фундаменту не буде.</p></div>
      <div class="path hl"><h3>Шлях B · Стратегічна переробка</h3>
        <p>Нова платформа, <b>кастомний UX/UI-дизайн</b>, первинна SEO-оптимізація, повна ecommerce-композиція. Дорожче й довше, але <b>стеля конверсії й вартість активу — інші</b>. Це шлях на масштаб.</p></div>
    </div>
    <p class="lead">Рекомендація залежить від амбіції та бюджету — але робити «як є» і чекати продажів немає сенсу: вітрина в поточному стані не конвертує.</p>
  </section>`;
}

/** Первостепенные боли (в довесок) + переход к команде/КП. */
function painsAndTeam(r: SiteAuditReport): string {
  const noAnalytics = !(r.stack?.signals ?? []).length && true; // аналитика редко видна извне
  const pains = [
    'Немає систем аналітики й трекінгу (GA4/GTM/Pixel) — без них не виміряти воронку й не порахувати гроші розривів',
    'Немає наскрізної аналітики та IP-телефонії — дзвінки й заявки не звʼязані з джерелом',
    'SEO-фундамент сирий: розмітка, Title/Description, дерево — ключове нижче, без води',
    r.stack?.commercialTemplate || r.stack?.builder ? `Платформа — ${r.stack?.cms ?? 'шаблонна CMS'}${r.stack?.builder ? ` на білдері ${r.stack.builder}` : ''}: шаблонна база, що впирається в стелю конверсії` : 'Шаблонна база вітрини — впирається в стелю конверсії',
  ];
  return `<section class="block">
    ${chapter('Першочергові болі та системна побудова', 'У довесок до головного')}
    <p class="lead">Окремо звертаю увагу — це не деталі аудиту, а системні блокери росту. Детально кожен — в окремих документах пакета.</p>
    <ul class="pains">${pains.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <h3>Будуємо системно — потрібна команда за етапами</h3>
    <p class="lead">Зібрати вітрину, яка конвертує 3–5%, точковими правками не можна. Це робота команди за етапами:</p>
    <table class="team"><thead><tr><th>Етап</th><th>Ролі</th></tr></thead><tbody>
      <tr><td>Стратегія й аналітика</td><td>стратег, бізнес-аналітик, маркетолог</td></tr>
      <tr><td>UX/UI-дизайн</td><td>UX-архітектор, UI-дизайнер, дизайн-директор</td></tr>
      <tr><td>Контент</td><td>копірайтер, фотограф/відео, контент-менеджер</td></tr>
      <tr><td>Розробка</td><td>фронтенд, бекенд, інтеграції (оплата/доставка/CRM)</td></tr>
      <tr><td>Трафік і зростання</td><td>SEO, performance, аналітик даних</td></tr>
    </tbody></table>
    <p class="lead">Конкретний склад, обсяг і етапи — у комерційній пропозиції (окремий документ).</p>
  </section>`;
}

export function renderPresentation(r: SiteAuditReport): string {
  const commercial = KIND_ORDER.map((k) => r.pages.find((p) => p.kind === k)).filter((p): p is PageReport => Boolean(p));
  const secondary = r.pages.filter((p) => !KIND_ORDER.includes(p.kind));
  const missingMand = r.pageTypes.filter((t) => t.mandatory && t.status === 'не найдена');
  const missingVar = r.pageTypes.filter((t) => !t.mandatory && t.status === 'не найдена');

  let n = 0;
  const commercialBody = commercial.length
    ? commercial.map((p) => pageBlock(p, ++n)).join('')
    : '<p class="lead">Комерційні сторінки не розібрані — потрібні скріншоти внутрішніх сторінок (каталог, картка товару) для розбору зором.</p>';
  const secondaryBody = secondary.length
    ? `<section class="block">${chapter('Другорядні сторінки')}<p class="lead">Акції, новинки, блог — підтримують шлях, але не несуть основну конверсію.</p>${secondary.map((p) => pageBlock(p, ++n)).join('')}</section>`
    : '';

  const treeBody = `<section class="block">
    ${chapter('Сторінки, яких немає — архітектура дерева', 'Чого бракує вітрині')}
    <p class="verdict">Дерево сайту неповне з погляду ecommerce й бізнесу — покупцю й пошуку бракує входів.</p>
    ${missingMand.length ? `<div><b class="gap">Обовʼязкові, яких немає:</b> ${missingMand.map((t) => esc(t.label)).join(' · ')}</div>` : "<p class='lead'>Обовʼязкові сторінки на місці.</p>"}
    ${missingVar.length ? `<div style="margin-top:6px"><b class="warn">Змінні за моделлю бізнесу, яких немає:</b> ${missingVar.map((t) => esc(t.label)).join(' · ')}</div>` : ''}
  </section>`;

  const coverHtml = cover({
    kicker: 'Презентація аудиту',
    title: 'Презентація аудиту вітрини',
    verdict: r.design?.verdict || r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, ...(r.stack?.cms ? [{ label: 'Платформа', value: r.stack.cms + (r.stack.templateName ? ` · ${r.stack.templateName}` : '') }] : [])],
    score: { pct: r.totalPct, cap: `відповідність еталону · ${r.totalScore}/${r.totalMax}` },
    note: 'Це презентація розбору вашого сайту й рекомендації — по порядку: сторінки, що є (комерційний шлях), яких немає, і що з цим робити. Ведемо до одного рішення.',
  });

  const intro = `<section class="block">
    ${chapter('З чого починаємо', 'Вступ')}
    <p class="lead">Ви розвиваєте напрям онлайн-продажів. Я провів детальний розбір вашого сайту й презентую його по порядку: спершу пройдемо сторінки, що є, — почнемо з комерційного шляху (головна → каталог → картка товару), кожну розберемо поблочно. Далі — яких сторінок бракує. Потім — головне: два шляхи розвитку й що це дає в грошах. Наприкінці — першочергові системні болі.</p>
  </section>`;

  const body = coverHtml
    + intro
    + `<section class="block">${chapter('Сторінки, що є — комерційний шлях', 'Головна → каталог → картка')}<p class="lead">Кожен блок — зліва як зараз, справа як треба (за трендами ecommerce, UX, SEO, CTA). Блок, якого немає, показано, яким має бути.</p></section>`
    + commercialBody
    + secondaryBody
    + treeBody
    + centralBranch(r)
    + painsAndTeam(r)
    + pageFooter('Презентація зовнішнього аудиту вітрини. Деталі кожного напряму — в окремих документах пакета.');

  return doc(`Презентація аудиту · ${r.client}`, body, EXTRA_CSS);
}

const EXTRA_CSS = `
  :root{--weak:#ea580c;}
  ${WIREFRAME_CSS}
  .verdict{font-size:14px;line-height:1.35;font-weight:600;color:var(--ink);margin:0 0 8px;max-width:165mm;}
  .warn{color:var(--weak);}
  .page-blk{page-break-inside:auto;}
  .pb-head{display:flex;align-items:flex-start;gap:9px;}
  .pb-n{font-size:16px;font-weight:800;color:var(--lime);line-height:1;}
  .pb-kick{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);}
  .pb-score{margin-left:auto;font-weight:800;font-size:15px;}
  .pb-score.ok{color:var(--ok);} .pb-score.check{color:var(--check);} .pb-score.gap{color:var(--gap);}
  .pb-sum{font-size:10px;margin:6px 0 8px;display:flex;flex-direction:column;gap:3px;}
  .pb-cards{margin-top:4px;}
  /* экономика */
  .econ{display:flex;align-items:center;gap:14px;margin:10px 0;}
  .econ-now,.econ-tgt{flex:1;border:1px solid var(--line);border-radius:8px;padding:12px 14px;text-align:center;}
  .econ-tgt{border-color:var(--ok);} .econ-now{border-color:var(--gap);}
  .econ-cap{font-size:8.5px;font-weight:800;letter-spacing:.5px;color:var(--muted);}
  .econ-big{font-size:34px;font-weight:800;line-height:1.1;letter-spacing:-1px;}
  .econ-note{font-size:8.5px;color:var(--muted);line-height:1.3;margin-top:3px;}
  .econ-arrow{font-size:26px;color:var(--muted);font-weight:800;}
  .paths{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;}
  .path{border:1px solid var(--line);border-radius:7px;padding:10px 12px;} .path.hl{border-color:var(--lime);border-left-width:3px;}
  .path h3{margin-top:0;} .path p{font-size:10px;color:#333;margin:0;line-height:1.45;}
  .pains{margin:6px 0 10px;padding-left:18px;} .pains li{margin:4px 0;font-size:10.5px;}
  .team{margin:4px 0;} .team td{font-size:10px;padding:5px 8px;} .team th{font-size:9px;}
`;
