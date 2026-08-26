/**
 * Пакеты знаний (путь Б). Папка `worker/knowledge/` из markdown-файлов, которые
 * аудит САМ подмешивает в промпт анализа как дополнительный метод-контекст —
 * без кода. Добавить «скилл-знание» = положить .md-файл (можно через GitHub);
 * Railway пересоберёт, и следующий аудит его учтёт.
 *
 * Опциональный frontmatter в начале файла:
 *   ---
 *   title: Короткое имя пакета
 *   scope: analyze, uxui, prototype   # где подмешивать; all или пусто = везде
 *   ---
 *
 * Скоупы: analyze (главный аудит), uxui (UX/AQC-разбор), prototype (композиция).
 * Каталог переопределяется env KNOWLEDGE_DIR. README.md игнорируется.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type KnowledgePack = { file: string; title: string; scope: string[]; body: string };

const DEFAULT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'knowledge');
const MAX_FILE = 20000;   // усечение одного пакета
const MAX_TOTAL = 60000;  // потолок подмешиваемого контекста на один вызов

let cache: KnowledgePack[] | null = null;

function parse(file: string, raw: string): KnowledgePack {
  let title = file.replace(/\.md$/i, '');
  let scope = ['all'];
  let body = raw;
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    const t = m[1].match(/title:\s*(.+)/i);
    if (t) title = t[1].trim();
    const s = m[1].match(/scope:\s*(.+)/i);
    if (s) { const arr = s[1].split(',').map((x) => x.trim().toLowerCase()).filter(Boolean); if (arr.length) scope = arr; }
  }
  body = body.trim();
  if (body.length > MAX_FILE) body = body.slice(0, MAX_FILE) + '\n…(усечено)';
  return { file, title, scope, body };
}

/** Читает пакеты знаний из каталога (с кэшем на процесс). */
export async function loadPacks(): Promise<KnowledgePack[]> {
  if (cache) return cache;
  const dir = process.env.KNOWLEDGE_DIR || DEFAULT_DIR;
  try {
    const files = (await readdir(dir)).filter((f) => /\.md$/i.test(f) && f.toLowerCase() !== 'readme.md');
    const packs: KnowledgePack[] = [];
    for (const f of files.sort()) {
      const raw = await readFile(join(dir, f), 'utf8').catch(() => '');
      if (raw.trim()) packs.push(parse(f, raw));
    }
    cache = packs;
  } catch {
    cache = [];
  }
  return cache;
}

/** Контекст для конкретного скоупа: конкатенация релевантных пакетов, с потолком. */
export function scopedContext(packs: KnowledgePack[], scope: string): string {
  const relevant = packs.filter((p) => p.scope.includes('all') || p.scope.includes(scope));
  if (!relevant.length) return '';
  let total = 0;
  const parts: string[] = [];
  for (const p of relevant) {
    const chunk = `### Пакет знаний: ${p.title}\n${p.body}`;
    if (total + chunk.length > MAX_TOTAL) break;
    total += chunk.length;
    parts.push(chunk);
  }
  if (!parts.length) return '';
  return `\n\n=== ДОПОЛНИТЕЛЬНЫЕ ПАКЕТЫ ЗНАНИЙ ===\nЭто кураторские дополнения к методу. Соблюдай их наравне с системной инструкцией; при конфликте с базовым методом — приоритет у базового, а расхождение отметь.\n\n${parts.join('\n\n')}`;
}

/** Подмешиваемый метод-контекст для скоупа (analyze | uxui | prototype). */
export async function knowledgeFor(scope: string, domain?: string): Promise<string> {
  const base = scopedContext(await loadPacks(), scope);
  // Профильные скиллы домена (+ слои аналитика и консультанта) — только когда
  // домен задан: общий анализ по-прежнему получает лишь дистилляты.
  if (!domain) return base;
  const { domainContext } = await import('./domainSkills.js');
  const { pluginSkillsFor } = await import('./skillRegistry.js');
  return base + (await domainContext(domain)) + (await pluginSkillsFor(domain));
}

export async function knowledgeCount(): Promise<number> {
  return (await loadPacks()).length;
}
