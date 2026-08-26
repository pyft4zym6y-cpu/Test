/**
 * База знаний клиента, приехавшая из админки, — в компактный текст для промпта.
 * Формат намеренно плотный: это КОНТЕКСТ (что мы уже знаем и чего у нас нет), а
 * не данные для расчёта. Числа и выводы аудитор берёт из обхода и движка.
 */
type Pack = Record<string, unknown>;

/** Разбор Search Console, приехавший из админки (см. system/admin/searchGaps.ts). */
type SearchPack = {
  period?: { start?: string; end?: string };
  prevPeriod?: { start?: string; end?: string };
  totals?: { clicks: number; impressions: number; ctr: number; position: number };
  counts?: { rows?: number; pages?: number; queries?: number; truncated?: boolean };
  striking?: { query?: string; page?: string; impressions: number; position: number; upliftEst: number }[];
  cannibal?: { query?: string; impressions: number; pages: { page?: string; position: number }[] }[];
  ctrGap?: { query?: string; page?: string; impressions: number; position: number; ctr: number; expectedCtr: number }[];
  decay?: { page?: string; clicksNow: number; clicksPrev: number; dropPct: number }[];
};
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v as Record<string, unknown>[] : []);
const str = (v: unknown): string => (v == null ? '' : String(v));

export function renderKnowledge(pack: Pack | null | undefined): string {
  if (!pack || typeof pack !== 'object') return '';
  const L: string[] = ['БАЗА ЗНАНИЙ КЛИЕНТА (собрана консультантом до прогона):'];

  if (pack.phase) L.push(`Фаза работы: ${str(pack.phase)}`);

  const company = pack.company as Record<string, unknown> | undefined;
  if (company && Object.keys(company).length) {
    L.push('Профиль: ' + Object.entries(company).map(([k, v]) => `${k}=${str(v)}`).join('; '));
  }

  const acc = arr(pack.accesses);
  if (acc.length) {
    L.push(`Доступы, которые нам открыли (${acc.length}): `
      + acc.map((a) => `${str(a.system)} [${str(a.status)}${a.method ? `/${str(a.method)}` : ''}]`).join('; '));
  } else {
    L.push('Доступов не предоставлено — выводы строятся только на внешнем обходе.');
  }

  const mkt = arr(pack.marketplaces).filter((m) => m.name);
  if (mkt.length) L.push('Маркетплейсы: ' + mkt.map((m) => `${str(m.name)} [${str(m.status) || '—'}]`).join('; '));

  const files = arr(pack.files);
  if (files.length) L.push(`Файлы от клиента (${files.length}): ` + files.map((f) => str(f.title)).join('; '));
  else L.push('Файлов клиент не загружал.');

  const sc = arr(pack.scoring);
  if (sc.length) {
    L.push('Наша предыдущая оценка модулей: '
      + sc.map((s) => `${str(s.module)}${s.gap ? ` — разрыв: ${str(s.gap)}` : ''}${s.priority ? ` (${str(s.priority)})` : ''}`).join('; '));
  }

  const runs = arr(pack.priorRuns);
  if (runs.length) {
    L.push(`Прошлые прогоны (${runs.length}): `
      + runs.map((r) => `${str(r.at).slice(0, 10)} ${str(r.site)} T${str(r.tier)}${r.health != null ? ` health=${str(r.health)}` : ''}`).join('; '));
    L.push('Не повторяй прошлые выводы дословно — уточняй и показывай, что изменилось.');
  }

  const del = Array.isArray(pack.delivered) ? pack.delivered as unknown[] : [];
  if (del.length) L.push(`Клиенту уже переданы документы: ${del.map(str).join('; ')}.`);

  const notes = Array.isArray(pack.notes) ? pack.notes as unknown[] : [];
  if (notes.length) L.push('Заметки команды: ' + notes.map(str).join(' | '));

  // Search Console — единственный блок здесь, который несёт ЧИСЛА, а не контекст.
  // Он приехал из системы клиента (L1), поэтому подаётся отдельно и с периодом:
  // без периода число нельзя сравнивать ни с чем.
  const sd = pack.search as SearchPack | undefined;
  if (sd && sd.totals) {
    const per = sd.period ? `${str(sd.period.start)}…${str(sd.period.end)}` : 'период не указан';
    L.push(`SEARCH CONSOLE (прямой доступ к системе клиента, ${per}): `
      + `${sd.totals.clicks} кликов, ${sd.totals.impressions} показов, CTR ${sd.totals.ctr}%, средняя позиция ${sd.totals.position} `
      + `(взвешена по показам). Выборка: ${sd.counts?.queries ?? '?'} запросов на ${sd.counts?.pages ?? '?'} страницах`
      + (sd.counts?.truncated ? ', обрезана по верхним парам — не выдавай за полный охват сайта.' : '.'));
    if (sd.striking?.length) {
      L.push(`Позиции 4–20 (${sd.striking.length}, ближайший рост): `
        + sd.striking.slice(0, 12).map((x) => `«${str(x.query)}» поз.${x.position}, ${x.impressions} показов, +~${x.upliftEst} кликов → ${str(x.page)}`).join('; '));
      L.push('Оценка прироста — по усреднённой отраслевой кривой CTR, не по замеру этого сайта. '
        + 'В отчёте подавай как оценку с названным допущением, иначе это выдуманная точность.');
    }
    if (sd.cannibal?.length) {
      L.push(`Каннибализация (${sd.cannibal.length}): `
        + sd.cannibal.slice(0, 8).map((c) => `«${str(c.query)}» — ${c.pages.length} страниц (${c.pages.map((p2) => str(p2.page)).join(', ')})`).join('; ')
        + '. Сам факт не всегда вред: проверь, разные ли это интенты, прежде чем предлагать склейку.');
    }
    if (sd.ctrGap?.length) {
      L.push(`Позиция есть, кликов нет (${sd.ctrGap.length}): `
        + sd.ctrGap.slice(0, 8).map((g) => `«${str(g.query)}» поз.${g.position}, CTR ${g.ctr}% против ожидаемых ~${g.expectedCtr}% → ${str(g.page)}`).join('; ')
        + '. Это про сниппет (title/description/разметку), а не про позиции.');
    }
    if (sd.decay?.length) {
      const pp = sd.prevPeriod ? `${str(sd.prevPeriod.start)}…${str(sd.prevPeriod.end)}` : 'предыдущий период';
      L.push(`Страницы, теряющие клики (против ${pp}): `
        + sd.decay.slice(0, 8).map((d) => `${str(d.page)} ${d.clicksPrev}→${d.clicksNow} (−${d.dropPct}%)`).join('; ')
        + '. Падение по всему сайту сразу — обычно апдейт или сезон, а не страница: сверь с общей динамикой.');
    }
  } else {
    L.push('Search Console не подключён или данные не сохранены: позиции, каннибализация и динамика запросов не проверялись. '
      + 'Это пробел в данных, а не «проблем нет».');
  }

  const ac = pack.answersCount as { done?: number; total?: number } | undefined;
  if (ac?.total) {
    L.push(`Анкета заполнена на ${ac.done ?? 0}/${ac.total}.`
      + ((ac.done ?? 0) / ac.total < 0.6 ? ' Данных мало — помечай выводы как гипотезы и снижай уверенность.' : ''));
  }
  return L.join('\n');
}
