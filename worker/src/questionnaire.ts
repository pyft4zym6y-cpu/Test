/**
 * Приём заполненного клиентом опросника в РАЗНЫХ форматах: JSON, Excel (.xlsx/.xls),
 * Word (.docx), PDF. Извлекаем содержимое и сопоставляем с каталогом вопросов аудита
 * (portal/src/data/questions.json, 643 вопроса) через Claude → карта {qid:{answer}},
 * которую ест движок (computeEngine). JSON в «родной» форме отдаётся напрямую.
 */
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import mammoth from 'mammoth';
import { createMessage, extractJson, hasKey } from './anthropic.js';

export type Answers = Record<string, { answer: string }>;

let CATALOG: { id: string; text: string; options?: string[] }[] | null = null;
async function catalog(): Promise<{ id: string; text: string; options?: string[] }[]> {
  if (CATALOG) return CATALOG;
  const raw = await readFile(new URL('../../portal/src/data/questions.json', import.meta.url), 'utf8');
  CATALOG = (JSON.parse(raw) as any[]).map((q) => ({ id: q.id, text: q.text, options: q.options }));
  return CATALOG;
}

/** Уже структурированный ответ {qid:{answer}} — отдаём как есть, без Claude. */
function looksLikeAnswers(j: unknown): j is Answers {
  if (!j || typeof j !== 'object') return false;
  const vals = Object.values(j as Record<string, unknown>);
  return vals.length > 0 && vals.every((v) => v && typeof v === 'object' && 'answer' in (v as object));
}

/** Файл опросника → сырьё для Claude. Экспортируется ради теста: именно здесь
 *  живёт разбор недоверенного клиентского файла, и ломаться он должен на CI. */
export async function extract(path: string, type: string): Promise<{ text?: string; pdf?: string; json?: unknown }> {
  const t = (type || '') + ' ' + path;
  if (/json/i.test(t)) return { json: JSON.parse(await readFile(path, 'utf8')) };
  if (/pdf/i.test(t)) return { pdf: await readFile(path, 'base64') };
  if (/word|docx|officedocument\.wordprocessing/i.test(t)) { const r = await mammoth.extractRawText({ path }); return { text: r.value }; }
  // CSV и просто текст незачем гонять через парсер книги — это уже текст.
  if (/csv|text\/plain|\.txt$/i.test(t)) return { text: await readFile(path, 'utf8') };
  // Устаревший бинарный .xls (BIFF) exceljs не читает. Раньше его брал SheetJS,
  // но именно он и был дырой: xlsx@0.18.5 — последняя версия в npm, в ней живут
  // GHSA-4r6h-8v6p-xvw6 (prototype pollution) и GHSA-5pgg-2g8v-p4x9 (ReDoS), а
  // файл сюда приносит КЛИЕНТ. Просить пересохранить в .xlsx дешевле, чем
  // держать уязвимый парсер на пути недоверенного ввода.
  if (/\.xls$|ms-excel(?!\.sheet)/i.test(t)) {
    // Коротко: сообщение уезжает в лог прогона, где режется по 90 символам.
    throw new Error('формат .xls не підтримується — збережіть як .xlsx або .csv');
  }
  // Excel (xlsx) — все листы в CSV-текст.
  const wb = new ExcelJS.Workbook();
  // readFile, а не load(buffer): типы exceljs ждут Buffer из своего старого
  // @types/node, и любой буфер отсюда не проходит проверку типов.
  await wb.xlsx.readFile(path);
  const parts: string[] = [];
  wb.eachSheet((ws) => {
    const rows: string[] = [];
    ws.eachRow({ includeEmpty: false }, (row) => rows.push(rowToCsv(row)));
    parts.push(`# ${ws.name}\n${rows.join('\n')}`);
  });
  return { text: parts.join('\n\n') };
}

/** Строка листа → строка CSV. Значения exceljs богаче примитивов: формула
 *  отдаётся объектом {formula, result}, гиперссылка — {text, hyperlink},
 *  форматированный текст — {richText:[…]}. Без разворачивания в промпт уехало
 *  бы «[object Object]» вместо ответа клиента. */
function rowToCsv(row: ExcelJS.Row): string {
  const cells: string[] = [];
  // values — массив с холостой ячейкой 0; идём по индексу, чтобы пустые
  // колонки посередине не схлопывались и таблица не съезжала.
  const values = row.values as unknown[];
  for (let i = 1; i < values.length; i += 1) cells.push(cellText(values[i]));
  return cells.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',');
}

function cellText(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text?: string }[]).map((r) => r.text ?? '').join('');
    if ('result' in o) return cellText(o.result);
    if ('text' in o) return String(o.text ?? '');
    if ('hyperlink' in o) return String(o.hyperlink ?? '');
    if ('error' in o) return '';
    return '';
  }
  return String(v);
}

const SYSTEM = `Ти отримуєш заповнений клієнтом опитувальник (у вільній формі: таблиця, документ або текст) і КАТАЛОГ питань аудиту з їх id. Завдання — зіставити відповіді клієнта з питаннями каталогу ЗА ЗМІСТОМ і повернути JSON-мапу {qid: "відповідь клієнта"}.

Правила:
- Тільки питання, на які в опитувальнику є відповідь. Немає — пропускай qid.
- Для питань типу «Вибір» (у каталозі в дужках [опції]) приводь відповідь до найближчої опції за змістом.
- Нічого не вигадуй: беремо лише те, що клієнт реально написав.
- Значення — рядок (для мультивибору склей через « | »).

Поверни СТРОГО JSON: {"<qid>": "<відповідь>", ...}`;

/** Разбор файла опросника любого формата → карта ответов {qid:{answer}}. */
export async function parseQuestionnaireFile(path: string, type: string, log?: (m: string) => void): Promise<Answers | null> {
  let ex: Awaited<ReturnType<typeof extract>>;
  try { ex = await extract(path, type); }
  catch (e) { log?.(`⚠️ опитувальник: не вдалось прочитати файл (${String(e).slice(0, 90)})`); return null; }

  // Родной JSON в формате движка — отдаём напрямую.
  if (ex.json && looksLikeAnswers(ex.json)) return ex.json;

  if (!hasKey()) { log?.('⚠️ опитувальник у не-JSON форматі потребує ключ Claude для розбору — пропущено'); return null; }

  try {
    const cat = await catalog();
    const catText = cat.map((q) => `${q.id}: ${q.text}${q.options?.length ? ` [${q.options.join(' | ')}]` : ''}`).join('\n');
    const content: any[] = [{ type: 'text', text: `КАТАЛОГ ПИТАНЬ АУДИТУ (id: питання [опції]):\n${catText}\n\n=== ЗАПОВНЕНИЙ ОПИТУВАЛЬНИК КЛІЄНТА: ===` }];
    if (ex.pdf) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: ex.pdf } });
    else content.push({ type: 'text', text: (ex.text ?? JSON.stringify(ex.json)).slice(0, 80000) });
    content.push({ type: 'text', text: 'Зістав і поверни JSON-мапу {qid: "відповідь"}.' });
    const resp: any = await createMessage({ max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content }] });
    const txt = (resp.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const map = extractJson<Record<string, string>>(txt);
    const out: Answers = {};
    for (const [qid, ans] of Object.entries(map)) if (ans != null && String(ans).trim()) out[qid] = { answer: String(ans).trim() };
    log?.(`✓ опитувальник розібрано (${type.includes('pdf') ? 'PDF' : type.includes('word') || /docx/.test(path) ? 'Word' : /xls/.test(path) ? 'Excel' : 'файл'}): ${Object.keys(out).length} відповідей зіставлено з каталогом`);
    return Object.keys(out).length ? out : null;
  } catch (e) {
    log?.(`⚠️ опитувальник: розбір через Claude не відпрацював (${String(e).slice(0, 90)})`);
    return null;
  }
}
