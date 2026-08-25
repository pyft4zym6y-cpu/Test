/**
 * База знаний клиента, приехавшая из админки, — в компактный текст для промпта.
 * Формат намеренно плотный: это КОНТЕКСТ (что мы уже знаем и чего у нас нет), а
 * не данные для расчёта. Числа и выводы аудитор берёт из обхода и движка.
 */
type Pack = Record<string, unknown>;
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

  const ac = pack.answersCount as { done?: number; total?: number } | undefined;
  if (ac?.total) {
    L.push(`Анкета заполнена на ${ac.done ?? 0}/${ac.total}.`
      + ((ac.done ?? 0) / ac.total < 0.6 ? ' Данных мало — помечай выводы как гипотезы и снижай уверенность.' : ''));
  }
  return L.join('\n');
}
