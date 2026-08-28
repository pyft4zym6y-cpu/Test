import { supabase, CONFIGURED } from '@/lib/supa';
import { KB_BASE, type KbItem, type KbKind } from '@/data/kbLibrary';
import type { SysKey } from '@/system/systems';

/**
 * Живий шар бібліотеки агенції — таблиця `kb_library` (docs/kb-library.sql).
 *
 * Базовий шар лежить у коді й доступний завжди. Цей — те, що команда додає з
 * адмінки. Головне тут: якщо таблиці ще немає або RLS не пустила, панель НЕ
 * має показати порожню бібліотеку. Порожньо й «не налаштовано» — різні речі,
 * а на екрані виглядають однаково, тож причину повертаємо текстом.
 */

export type KbLoad = { team: KbItem[]; error?: string; missing?: boolean };

/** Таблиці ще немає — типова відповідь Postgres на select із неї. */
const isMissingTable = (msg: string) => /relation .* does not exist|could not find the table|42P01|PGRST205/i.test(msg);

const fromRow = (r: Record<string, unknown>): KbItem => ({
  id: String(r.id),
  title: String(r.title || ''),
  kind: (String(r.kind || 'method') as KbKind),
  sys: (Array.isArray(r.sys) ? r.sys : []) as SysKey[],
  summary: String(r.summary || ''),
  body: r.body ? String(r.body) : undefined,
  url: r.url ? String(r.url) : undefined,
  forClient: Boolean(r.for_client),
  by: r.by_email ? String(r.by_email) : undefined,
  at: r.created_at ? String(r.created_at) : undefined,
  updatedAt: r.updated_at ? String(r.updated_at) : undefined,
  source: 'team',
});

export async function loadKbTeam(): Promise<KbLoad> {
  if (!CONFIGURED) return { team: [], error: 'Supabase не налаштовано — доступний лише базовий шар із коду.' };
  try {
    const { data, error } = await supabase.from('kb_library').select('*').order('updated_at', { ascending: false }).limit(500);
    if (error) {
      return isMissingTable(error.message)
        ? { team: [], missing: true, error: 'Таблиці `kb_library` ще немає. Виконайте docs/kb-library.sql у Supabase — до того працює лише базовий шар із коду.' }
        : { team: [], error: error.message };
    }
    return { team: (data || []).map((r) => fromRow(r as Record<string, unknown>)) };
  } catch (e) { return { team: [], error: String(e) }; }
}

export async function saveKbItem(item: KbItem, byEmail?: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  if (item.source === 'base') return { ok: false, error: 'Базовий матеріал редагується в коді (src/data/kbLibrary.ts), а не тут.' };
  try {
    // .select() обовʼязковий: без нього відмова RLS приходить як 200 із нулем
    // рядків — тобто як успіх.
    const { data, error } = await supabase.from('kb_library').upsert({
      id: item.id, title: item.title, kind: item.kind, sys: item.sys || [],
      summary: item.summary || '', body: item.body || null, url: item.url || null,
      for_client: Boolean(item.forClient), by_email: byEmail || item.by || null,
    }, { onConflict: 'id' }).select('id');
    if (error) return { ok: false, error: isMissingTable(error.message) ? 'Таблиці `kb_library` немає — виконайте docs/kb-library.sql.' : error.message };
    if (!data || data.length === 0) return { ok: false, error: 'Не збережено: RLS не дала запис. Редагувати бібліотеку можуть ролі super і admin.' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function deleteKbItem(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!CONFIGURED) return { ok: false, error: 'not_configured' };
  try {
    const { data, error } = await supabase.from('kb_library').delete().eq('id', id).select('id');
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) return { ok: false, error: 'Не видалено: RLS не дала. Видаляти можуть ролі super і admin.' };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

/**
 * Уся бібліотека: базовий шар + командний. Збіг id означає, що команда
 * перевизначила базовий матеріал своєю версією — перемагає командна.
 */
export const mergeKb = (team: KbItem[]): KbItem[] => {
  const byId = new Map<string, KbItem>();
  for (const i of KB_BASE) byId.set(i.id, i);
  for (const i of team) byId.set(i.id, i);
  return [...byId.values()];
};

/** Матеріали під конкретні системи — звʼязок бібліотеки з аудитом клієнта. */
export const kbForSystems = (all: KbItem[], sys: SysKey[]): KbItem[] => {
  if (!sys.length) return [];
  return all.filter((i) => (i.sys || []).some((s) => sys.includes(s)));
};

export const newKbId = () => 'kb_' + Math.random().toString(36).slice(2, 10);
