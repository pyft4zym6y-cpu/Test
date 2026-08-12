/**
 * Технический внешний аудит A0 — клиентский PDF на общем визуальном стандарте.
 * Категории со статусом, таблица проверок, честная пометка BLOCKED (нужен
 * инструмент/доступ на A1).
 */
import { esc, dimBadges, scoreColor, doc, methodologySection, swSection, recsSection, conclusionSection, type SectionRec } from './reportShell.js';
import type { TechReport, TStatus } from '../techaudit.js';

const MARK: Record<TStatus, string> = { ok: '✓', check: '◐', gap: '✕', blocked: '⛔' };
const CLS: Record<TStatus, string> = { ok: 'ok', check: 'check', gap: 'gap', blocked: 'check' };
const WORD: Record<TStatus, string> = { ok: 'ок', check: 'проверить', gap: 'нет', blocked: 'нужен доступ' };

export function renderTechAuditHtml(r: TechReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');

  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Технический внешний аудит · внешний аудит витрины</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Объём</span><span class="val">внешний аудит витрины</span></div>
    </div>
    <div class="cov-score"><div class="big ${scoreColor(r.score.pct)}">${r.score.pct}<span>%</span></div><div class="big-cap">технических проверок пройдено · ${r.score.passed}/${r.score.total}</div></div>
    <div class="coverage"><b>Что видно во внешнем аудите:</b> проверки выполняются по отрендеренному DOM разобранных страниц (внешний обход).
    ${r.blocked.length ? `Не измеримо внешними средствами и вынесено на следующий этап (после передачи доступов): ${esc(r.blocked.join(', '))}.` : ''} Отсутствие данных не выдаётся за факт.</div>
  </div></section>`;

  const cats = r.categories.map((c) => {
    const rows = c.checks.map((ch) => `<tr>
      <td class="c-name">${esc(ch.label)}</td>
      <td class="c-st ${CLS[ch.status]}"><span class="st ${CLS[ch.status]}">${MARK[ch.status]}</span> ${WORD[ch.status]}</td>
      <td class="c-note">${esc(ch.note)}</td>
      <td class="c-rec">${esc(ch.rec)}</td>
    </tr>`).join('');
    return `<section class="block">
      <h2><span class="st ${CLS[c.status]}">${MARK[c.status]}</span> ${esc(c.title)} <span class="cat-dims">${dimBadges(c.dims)}</span></h2>
      <table><thead><tr><th>Проверка</th><th>Статус</th><th>Данные</th><th>Рекомендация</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
  }).join('');

  // ── Консалтинговый каркас: оценка из фактов, а не список задач ──
  const allChecks = r.categories.flatMap((c) => c.checks.map((ch) => ({ ...ch, cat: c.title })));
  const okChecks = allChecks.filter((c) => c.status === 'ok');
  const gapChecks = allChecks.filter((c) => c.status === 'gap');
  const checkChecks = allChecks.filter((c) => c.status === 'check');
  const okCats = r.categories.filter((c) => c.status === 'ok').map((c) => c.title);
  const gapCats = r.categories.filter((c) => c.status === 'gap').map((c) => c.title);

  const meth = methodologySection({
    goal: 'Зафиксировать состояние технического фундамента витрины по внешним признакам: что работает, что сломано, что измеримо только инструментами.',
    sources: ['Внешний обход: отрендеренный DOM всех разобранных страниц', 'robots.txt и sitemap.xml с корня домена', 'Замеры мобильности (тап-цели, кегль) из рендера'],
    scope: `${r.score.total} измеримых проверок в ${r.categories.length} категориях; ${r.blocked.length} проверок помечены «Нужны доступы» (нужен инструмент/доступ).`,
    limits: 'Внешний аудит витрины видит клиентскую часть. Core Web Vitals, заголовки сервера, лог индексации — после передачи доступов (следующий этап; PageSpeed/CrUX, доступ к серверу и Search Console).',
  });

  const strengths = [
    ...(okCats.length ? [`Категории без единого замечания: ${okCats.join(', ')} — этот фундамент можно не трогать и строить на нём`] : []),
    ...okChecks.slice(0, 5).map((c) => `${c.label} (${c.cat}): ${c.note} — работает на всех проверенных страницах`),
  ];
  const weaknesses = [
    ...(gapCats.length ? [`Провальные категории: ${gapCats.join(', ')} — систематический разрыв, не случайность`] : []),
    ...gapChecks.slice(0, 6).map((c) => `${c.label}: ${c.note} — ${c.rec}`),
    ...(gapChecks.length ? [] : checkChecks.slice(0, 3).map((c) => `${c.label}: ${c.note} — неустойчиво, проверить шаблон`)),
  ];
  const recs: SectionRec[] = [
    ...gapChecks.map((c): SectionRec => ({ pr: /schema|sitemap|robots|canonical|noindex|https|аналитик/i.test(c.label) ? 'P0' : 'P1', action: c.rec, effect: `Закрывает разрыв «${c.label}» (${c.cat})` })),
    ...checkChecks.filter((c) => c.rec !== '—').slice(0, 4).map((c): SectionRec => ({ pr: 'P2', action: c.rec, effect: `Стабилизирует «${c.label}» (${c.note})` })),
  ];

  const worstCat = [...r.categories].sort((a, b) => b.checks.filter((c) => c.status === 'gap').length - a.checks.filter((c) => c.status === 'gap').length)[0];
  const concl = conclusionSection([
    `Из ${r.score.total} измеримых проверок пройдено ${r.score.passed} (${r.score.pct}%). ${r.score.pct >= 70 ? 'Технический фундамент рабочий: он не блокирует рост, и вложения дадут отдачу поверх него.' : r.score.pct >= 45 ? 'Фундамент неровный: часть систем работает, но разрывы в ключевых категориях гасят эффект остальных вложений.' : 'Фундамент проблемный: технические разрывы будут съедать эффект любых маркетинговых и UX-вложений, пока не закрыты.'}`,
    gapChecks.length
      ? `Главная зона потерь — «${worstCat?.title}»: ${gapChecks.slice(0, 3).map((c) => c.label.toLowerCase()).join(', ')}. Это не косметика: каждая из этих позиций напрямую влияет на то, как поисковые системы видят и показывают витрину, то есть на бесплатный трафик.`
      : 'Систематических технических провалов не зафиксировано — редкая ситуация, которую стоит закрепить регламентом релизов (перед каждым релизом гонять этот же чек-лист).',
    `${r.blocked.length} проверок (${r.blocked.join(', ') || '—'}) невозможно провести без инструментов и доступов — они не «хорошие» и не «плохие», а неизвестные. По принципу честных данных они не засчитываются ни в плюс, ни в минус до измерения после передачи доступов (следующий этап).`,
  ], 'Следующий этап: PageSpeed/CrUX (Core Web Vitals), проверка заголовков сервера, полный crawl (Screaming Frog) и связка с Search Console.');

  const footer = `<section class="block"><div class="footer">Commerce OS · Технический внешний аудит · ${esc(r.client)} · ${esc(date)}. Внешний аудит витрины: внешний обход. Отсутствие данных не выдаётся за факт и не скрывается; проверки со статусом «Нужны доступы» закрываются после передачи доступов инструментом/доступом.</div></section>`;

  const extra = `.c-name{font-weight:600;white-space:nowrap;} .c-st{white-space:nowrap;font-size:9.5px;} .c-note{color:var(--muted);font-size:10px;white-space:nowrap;} .c-rec{color:#333;}
    .st{font-size:12px;} .st.ok{color:var(--ok);} .st.check{color:var(--check);} .st.gap{color:var(--gap);} .cat-dims{font-weight:400;}`;
  return doc(`Технический аудит · ${r.client}`, cover + meth + cats + swSection(strengths, weaknesses) + recsSection(recs) + concl + footer, extra);
}
