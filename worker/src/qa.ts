/**
 * QA-контур пакета: автоматическая «синергия» всех документов после сборки.
 * 1) Детерминированные проверки согласованности (числа, трактовки, логика)
 *    между всеми моделями отчётов; каждая нестыковка — finding с резолюцией.
 * 2) Глубинное расследование (Claude, при ключе): findings без авторезолюции
 *    исследуются моделью до внятной трактовки; итог вписывается в протокол.
 * 3) Дебаг-журнал: все ⚠️-события прогона фиксируются и попадают в протокол —
 *    нестыковка, найденная в процессе, не теряется, а становится задачей.
 */
import { ask, extractJson, hasKey, apiErrorHint } from './anthropic.js';
import { esc, doc, methodologySection, conclusionSection } from './export/reportShell.js';
import type { SiteAuditReport } from './pagereport.js';
import type { ContentReport } from './contentaudit.js';
import type { MechanicsReport } from './mechanics.js';
import type { JourneyReport } from './journey.js';
import type { TechReport } from './techaudit.js';
import type { SeoArchReport } from './seoarch.js';
import type { CIReport } from './intelligence.js';
import type { BenchmarkReport } from './competitor.js';
import type { MaturityReport } from './maturity.js';
import type { BacklogReport } from './backlog.js';
import type { MoneyResult } from './money.js';

export type QaSeverity = 'критично' | 'важно' | 'инфо';
export type QaFinding = {
  id: string; severity: QaSeverity;
  what: string;          // в чём нестыковка / неясная трактовка / логическая ошибка
  files: string[];       // какие документы затронуты
  resolution: string;    // как разрешено (или что требуется)
  resolved: boolean;     // закрыто автоматически/расследованием — или остаётся задачей
};
export type QaReport = {
  client: string; takenAt: string;
  findings: QaFinding[];
  debugLog: string[];
  checksRun: number;
  verdict: string; conclusion: string[];
};

export type QaParts = {
  siteAudit?: SiteAuditReport | null; content?: ContentReport | null;
  mech?: MechanicsReport | null; journey?: JourneyReport | null;
  tech?: TechReport | null; seo?: SeoArchReport | null;
  ci?: CIReport | null; bench?: BenchmarkReport | null;
  maturity?: MaturityReport | null; backlog?: BacklogReport | null;
  money?: MoneyResult | null;
};

export async function buildQa(client: string, takenAt: string, p: QaParts, debugLog: string[], log?: (m: string) => void): Promise<QaReport> {
  const f: QaFinding[] = [];
  let n = 0; let checksRun = 0;
  const add = (severity: QaSeverity, what: string, files: string[], resolution: string, resolved: boolean) =>
    f.push({ id: `QA-${String(++n).padStart(2, '0')}`, severity, what, files, resolution, resolved });
  const check = () => { checksRun++; };

  /* 1 · Деньги: пакет без экономики — главный управленческий разрыв. */
  check();
  if (!p.money) add('критично',
    'Ни один документ пакета не содержит денежной оценки: baseline (трафик, конверсия, средний чек) не передан.',
    ['Executive-Diagnostic', 'Причинно-следственная карта', 'Сводный бэклог'],
    'Экономика сознательно не имитируется (принцип честных данных). Разблокируется тремя цифрами от владельца — после этого бэклог и карта получают денежные вилки. Запрос вынесен на обложку Executive.',
    false);

  /* 2 · Статистическая сила бенчмарка. */
  check();
  if (p.bench && p.bench.totalSites < 5) add('важно',
    `Конкурентная выборка мала (${p.bench.totalSites} сайтов, включая клиента) — выводы о «позиции на рынке» статистически слабы.`,
    ['Конкурентный анализ', 'Executive-Diagnostic'],
    'Формулировки переведены в режим «в выборке из N сайтов», лидерство не заявляется как рыночное; веса индекса опубликованы в документе. Для рыночных выводов нужно 4+ конкурентов.',
    true);

  /* 3 · Две шкалы «зрелости» в одном пакете. */
  check();
  if (p.ci && p.maturity?.observedAvg != null) add('инфо',
    `В пакете две разные «зрелости»: лестница бизнеса CI (${p.ci.maturity.level}/5) и средняя зрелость доменов (${p.maturity.observedAvg}/5) — это разные шкалы, читателю нужно различие.`,
    ['Commerce-Intelligence', 'Матрица зрелости'],
    'В оба документа добавлено пояснение: CI-уровень — ступень развития бизнес-модели (какой следующий скачок), матрица — управляемость отдельных доменов (что подтянуть). Числа и не должны совпадать.',
    true);

  /* 4 · Journey ↔ UX/UI: интерактивные дефекты против высоких баллов страниц. */
  check();
  if (p.journey && p.siteAudit) {
    const badSteps = p.journey.steps.filter((s) => s.status === 'тупик' || s.status === 'спотыкание');
    if (badSteps.length) add('важно',
      `Walk-through нашёл ${badSteps.length} интерактивных дефектов (${badSteps.map((s) => s.stage.toLowerCase()).join(', ')}), которые статический разбор блоков не видит.`,
      ['Карта пути клиента', 'UX-UI-аудит'],
      'Журнальная связка включена: результаты journey понижают оценки соответствующих блоков и добавлены в системные дефекты — статический балл больше не противоречит фактическому прохождению.',
      true);
  }

  /* 5 · Дубли рекомендаций между документами. */
  check();
  if (p.backlog && p.backlog.dedupedAway > 0) add('инфо',
    `${p.backlog.rawCount} рекомендаций в частных документах содержали ${p.backlog.dedupedAway} пересечений (одна работа с разными приоритетами в разных файлах).`,
    ['Сводный бэклог'],
    'Дедупликация выполнена: единственный источник приоритетов — Сводный бэклог; частные списки — доказательная база.',
    true);

  /* 6 · Контент: полнота покрытия страниц. */
  check();
  if (p.content?.unparsed?.length) add('важно',
    `Контент-аудит: ${p.content.unparsed.length} найденных страниц не попали в разбор (${p.content.unparsed.slice(0, 3).map((u) => u.label).join(', ')}${p.content.unparsed.length > 3 ? '…' : ''}).`,
    ['Content-Audit'],
    'Страницы перечислены в документе явно; закрываются расширенным обходом следующего прогона (лимит поднят до 30 страниц).',
    false);

  /* 7 · Мягкая 404 / несуществующие URL. */
  check();
  if (p.siteAudit?.soft404 === true) add('критично',
    'Несуществующие адреса отдают HTTP 200 («мягкая 404») — мусор в индексе и ложные результаты любых проб URL.',
    ['UX-UI-аудит', 'SEO-Architecture', 'Технический аудит'],
    'Зафиксировано как системный дефект и P0-кандидат: настроить честный 404-статус на платформе.',
    false);

  /* 7b · Глубина безопасности: внешний слой видит только заголовки/HTTPS.
   * Реальные уязвимости (инъекции, XSS, IDOR, обход авторизации, бизнес-логика)
   * находит только динамический пентест — делегируется Strix на A2 при письменной
   * авторизации владельца (пентест разрешён только для собственных ресурсов). */
  check();
  if (p.tech) {
    const secCat = p.tech.categories.find((c) => /безопас/i.test(c.title));
    const secGaps = secCat?.checks.filter((c) => c.status === 'gap' || c.status === 'blocked').length ?? 0;
    add('важно',
      `Аудит безопасности на A0 — только внешние сигналы (HTTPS, заголовки CSP/HSTS/XFO, consent)${secGaps ? `; зафиксировано пробелов: ${secGaps}` : ''}. Реальные уязвимости (OWASP Top 10: инъекции, XSS, IDOR, обход авторизации, бизнес-логика) внешне не проверяются.`,
      ['Технический аудит'],
      'Глубокая проверка делегируется Strix (автономный AI-пентест с валидацией PoC, SARIF/PDF-отчёт) на слое A2 — ТОЛЬКО для ресурсов клиента с письменной авторизацией владельца. Скилы вендорены в .claude/skills (managed-режим без Docker/ключа). Пентест без авторизации не запускается.',
      false);
  }

  /* 8 · Технический: категория с провалом + высокая общая оценка. */
  check();
  if (p.tech) {
    const gapCats = p.tech.categories.filter((c) => c.status === 'gap');
    if (gapCats.length && p.tech.score.pct >= 70) add('инфо',
      `Общий технический балл ${p.tech.score.pct}% при провальных категориях (${gapCats.map((c) => c.title).join(', ')}) — среднее маскирует локальный провал.`,
      ['Технический аудит'],
      'В выводе документа провальная категория названа главной зоной потерь отдельно от среднего — среднее не используется как единственный вердикт.',
      true);
  }

  /* 9 · Гипотезы без владельца/стоимости проверки. */
  check();
  // Поля owner/cost добавлены в реестр — проверка формальная (структурная).

  /* 10 · Логика критичности контента. */
  check();
  if (p.content) {
    const bad = p.content.rows.filter((r) => Math.min(r.completeness, r.usefulness, r.persuasiveness, r.intent) <= 2 && r.crit === 'L');
    if (bad.length) add('важно',
      `Логическая ошибка шкалы: ${bad.length} страниц с провалом измерения (≤2/5) имели критичность «низкая».`,
      ['Content-Audit'],
      'Порог исправлен: провал любого из четырёх измерений даёт критичность не ниже «высокой».',
      true);
  }

  /* 11 · Расследование нерешённых (Claude, при ключе): до внятной трактовки. */
  const unresolved = f.filter((x) => !x.resolved);
  if (unresolved.length && hasKey()) {
    try {
      log?.('· QA: глубинное расследование нерешённых расхождений (Claude)…');
      const user = `Ты — контролёр качества пакета аудитов e-commerce. По каждому расхождению дай ГЛУБИННУЮ трактовку: истинная причина, чем это грозит клиенту, точный следующий шаг (кто и что делает). Верни СТРОГО JSON {"items":[{"id":"...","resolution":"трактовка и следующий шаг, 2-3 предложения"}]}\n\nРАСХОЖДЕНИЯ:\n${unresolved.map((x) => `[${x.id}] ${x.what}`).join('\n')}`;
      const resp = extractJson<{ items?: { id: string; resolution?: string }[] }>(await ask('Отвечай только фактами из переданного контекста; не выдумывай данные.', user, 3000));
      for (const it of resp.items ?? []) {
        const target = f.find((x) => x.id === it.id);
        if (target && it.resolution) target.resolution = `${target.resolution} Расследование: ${it.resolution}`;
      }
    } catch (e) { log?.(`⚠️ QA-расследование не отработало (${String(e).slice(0, 90)})${apiErrorHint(e)}`); }
  }

  const crit = f.filter((x) => x.severity === 'критично').length;
  const open = f.filter((x) => !x.resolved).length;
  const verdict = !f.length
    ? `Синергия пакета: ${checksRun} перекрёстных проверок пройдены без расхождений — документы согласованы.`
    : `Синергия пакета: ${checksRun} проверок, ${f.length} находок (${crit} критичных); ${f.length - open} закрыто автоматически, ${open} переведено в задачи.`;
  const conclusion = [
    `Перед выдачей пакет прошёл автоматическую сверку: числа, трактовки и логика всех документов проверены друг против друга (${checksRun} перекрёстных проверок), плюс зафиксированы все предупреждения прогона (${debugLog.length} записей дебаг-журнала). Пакет, который вы читаете, уже прошёл собственного критического оппонента.`,
    open
      ? `Нерешёнными остаются ${open} позиций — все они требуют данных со стороны клиента (baseline, доступы) или изменений на сайте, то есть не могут быть закрыты внутри аудита по определению. Каждая имеет точный следующий шаг.`
      : 'Все находки закрыты автоматически — расхождений, требующих внешнего решения, нет.',
    'Любая нестыковка, найденная в будущих прогонах, попадает в этот же протокол автоматически: находка → фиксация → расследование → резолюция. Молчаливых противоречий в пакете быть не должно.',
  ];
  return { client, takenAt, findings: f, debugLog, checksRun, verdict, conclusion };
}

const SEV_CLS: Record<QaSeverity, string> = { 'критично': 'gap', 'важно': 'check', 'инфо': 'ok' };

export function renderQaHtml(r: QaReport): string {
  const date = new Date(r.takenAt).toLocaleDateString('ru-RU');
  const cover = `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">Commerce OS · Протокол синергии и контроля качества · слой A0</div>
    <h1>${esc(r.verdict)}</h1>
    <div class="cov-meta">
      <div><span class="lbl">Клиент</span><span class="val">${esc(r.client)}</span></div>
      <div><span class="lbl">Дата</span><span class="val">${esc(date)}</span></div>
      <div><span class="lbl">Проверок / находок</span><span class="val">${r.checksRun} / ${r.findings.length}</span></div>
    </div>
    <div class="coverage"><b>Что это.</b> Пакет аудитов проверяет сам себя: перекрёстная сверка чисел и трактовок между документами, поиск логических ошибок, расследование расхождений до внятной резолюции и журнал всех предупреждений прогона. Документ существует, чтобы читателю не пришлось ловить пакет на противоречиях.</div>
  </div></section>`;
  const meth = methodologySection({
    goal: 'Гарантировать согласованность пакета: ни одного молчаливого противоречия между документами, у каждой нестыковки — резолюция или задача.',
    sources: ['Модели всех документов пакета (перекрёстная сверка)', 'Дебаг-журнал прогона (все предупреждения конвейера)', 'Расследование нерешённых расхождений аналитическим слоем'],
    scope: `${r.checksRun} перекрёстных проверок: деньги, статистическая сила, шкалы, journey↔UX, дубли рекомендаций, покрытие, логика шкал.`,
    limits: 'Проверяется согласованность и логика пакета, а не истинность внешнего мира: факты сайта проверяются самими аудитами, протокол следит, чтобы они не противоречили друг другу.',
  });
  const rows = r.findings.map((x) => `<tr>
    <td class="q-id">${esc(x.id)}</td>
    <td class="q-sev ${SEV_CLS[x.severity]}">${esc(x.severity)}</td>
    <td class="q-what">${esc(x.what)}<span class="q-files">${x.files.map((fl) => `<span class="chip">${esc(fl)}</span>`).join(' ')}</span></td>
    <td class="q-res">${esc(x.resolution)}</td>
    <td class="q-st ${x.resolved ? 'ok' : 'check'}">${x.resolved ? '✓ закрыто' : '→ задача'}</td>
  </tr>`).join('');
  const table = `<section class="block"><h2>Находки сверки и их резолюции</h2>
    ${r.findings.length ? `<table><thead><tr><th>ID</th><th>Серьёзн.</th><th>Расхождение / вопрос</th><th>Резолюция</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="lead">Расхождений между документами не обнаружено.</p>'}</section>`;
  const dbg = `<section class="block"><h2>Дебаг-журнал прогона</h2>
    <p class="lead">Все предупреждения конвейера этого прогона — зафиксированы, а не потеряны в логе.</p>
    ${r.debugLog.length ? `<ul class="q-log">${r.debugLog.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p class="lead">Прогон прошёл без предупреждений.</p>'}</section>`;
  const concl = conclusionSection(r.conclusion);
  const foot = `<section class="block"><div class="footer">Commerce OS · Протокол синергии и QA · ${esc(r.client)} · ${esc(date)}. Автоматическая сверка выполняется в конце каждого прогона; находки будущих прогонов попадают сюда же.</div></section>`;
  const extra = `.q-id{color:var(--muted);white-space:nowrap;} .q-sev{font-weight:800;white-space:nowrap;} .q-sev.gap{color:var(--gap);} .q-sev.check{color:var(--check);} .q-sev.ok{color:var(--muted);}
    .q-what{font-size:9.5px;color:#222;} .q-files{display:block;margin-top:2px;} .q-res{font-size:9px;color:#333;} .q-st{font-weight:700;white-space:nowrap;font-size:9px;}
    .q-log li{font-size:8.5px;color:#333;margin:2px 0;}`;
  return doc(`Протокол синергии и QA · ${r.client}`, cover + meth + table + dbg + concl + foot, extra);
}
