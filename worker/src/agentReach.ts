/**
 * Адаптер Agent-Reach (github.com/Panniantong/Agent-Reach) для воркера аудита.
 * Даёт внешнему контуру (отзывы/соцсети/инфофон) РЕАЛЬНУЮ фактуру с площадок и из
 * веба — не только веб-поиск Claude. Grounding: перед вызовом Claude подкладываем
 * найденные выборки как первоисточник, чтобы выводы опирались на факты, а не на
 * пересказ поиска.
 *
 * Дизайн — безопасность по умолчанию (как headroom):
 *  - выключено, пока не задан AGENT_REACH=1;
 *  - CLI/бэкенды подхватываются, только если реально установлены на хосте
 *    (agent-reach install --system у пользователя); иначе — тихий пропуск;
 *  - любая ошибка/таймаут/egress-блок → пустая строка, поведение не меняется.
 *
 * Каналы, пригодные для программного вызова из воркера (без логина):
 *  - web  : Jina Reader (curl https://r.jina.ai/URL) — чистый текст любой страницы;
 *  - search: Exa через mcporter (agent-reach install --system подключает бесплатно).
 * Логин-платформы (X/Reddit/小红书) остаются агентными (скилл), не воркерными.
 */
import { execFile } from 'node:child_process';

const enabled = () => process.env.AGENT_REACH === '1';
const REACH_BIN = process.env.AGENT_REACH_BIN || 'agent-reach';
const CURL_BIN = process.env.CURL_BIN || 'curl';
const MCPORTER_BIN = process.env.MCPORTER_BIN || 'mcporter';

/**
 * Причины, по которым внешний инструмент не отработал. Раньше всё падало в null,
 * и в отчёте отсутствие БИНАРЯ выглядело как «поиск ничего не нашёл» — то есть
 * сломанный инструмент читался как факт о клиенте. Теперь причина видна.
 */
const toolFailures: Record<string, string> = {};
export function toolStatus(): Record<string, string> { return { ...toolFailures }; }

/** execFile → stdout или null. Причину неудачи записываем в toolFailures. */
function run(cmd: string, args: string[], timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
          const e = err as NodeJS.ErrnoException & { killed?: boolean };
          toolFailures[cmd] = e.code === 'ENOENT'
            ? 'не установлен в образе'
            : e.killed ? 'таймаут' : `код ${e.code ?? 'ошибка'}`;
          resolve(null);
          return;
        }
        delete toolFailures[cmd];
        resolve((stdout || '').toString());
      });
    } catch {
      toolFailures[cmd] = 'запуск не удался';
      resolve(null);
    }
  });
}

let availCache: { ok: boolean; channels: Record<string, string | null> } | null | undefined;

/** Установлен ли agent-reach и какие каналы «живые» (active_backend != null). */
export async function reachAvailable(): Promise<{ ok: boolean; channels: Record<string, string | null> } | null> {
  if (!enabled()) return null;
  if (availCache !== undefined) return availCache;
  const out = await run(REACH_BIN, ['doctor', '--json'], 20000);
  if (!out) { availCache = null; return null; }
  try {
    const doc = JSON.parse(out) as Record<string, { active_backend?: string | null }>;
    const channels: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(doc)) channels[k] = v?.active_backend ?? null;
    availCache = { ok: true, channels };
  } catch { availCache = null; }
  return availCache;
}

/** Чистый текст страницы через Jina Reader (без ключа). null — недоступно/блок. */
export async function reachWebRead(url: string, maxChars = 6000): Promise<string | null> {
  if (!enabled()) return null;
  const out = await run(CURL_BIN, ['-sL', '--max-time', '30', `https://r.jina.ai/${url}`], 35000);
  if (!out || out.length < 40) return null;
  return out.slice(0, maxChars);
}

/** Веб-поиск через Exa (mcporter). Возвращает сырой дайджест результатов или null. */
export async function reachSearch(query: string, n = 5): Promise<string | null> {
  if (!enabled()) return null;
  const out = await run(MCPORTER_BIN, ['call', 'exa.web_search_exa', `query=${query}`, `numResults=${n}`], 40000);
  if (!out || out.length < 20) return null;
  return out.slice(0, 4000);
}

const FOCUS_QUERY: Record<'reviews' | 'social' | 'mentions', (brand: string) => string> = {
  reviews: (b) => `${b} отзывы reviews рейтинг маркетплейс`,
  social: (b) => `${b} instagram facebook youtube tiktok официальный профиль`,
  mentions: (b) => `${b} упоминания бренд обзор форум каталог`,
};

/**
 * Блок grounding-фактов для промпта внешнего аудита. Пусто, если выключено /
 * недоступно / ничего не нашли — тогда builder работает как раньше (Claude web_search).
 */
export async function reachGrounding(
  brand: string,
  focus: 'reviews' | 'social' | 'mentions',
  log?: (m: string) => void,
): Promise<string> {
  if (!enabled()) return '';
  const avail = await reachAvailable();
  if (!avail?.ok) return '';
  const hasSearch = avail.channels.exa_search || avail.channels.web;
  if (!hasSearch) return '';
  log?.(`🌐 Agent-Reach: сбор фактуры (${focus}) для «${brand}»`);
  const parts: string[] = [];
  const search = await reachSearch(FOCUS_QUERY[focus](brand));
  if (search) parts.push(`ПОИСК (Exa):\n${search}`);
  if (!parts.length) return '';
  return `\n\n=== ФАКТУРА AGENT-REACH (реальные выборки с площадок; используй как ПЕРВОИСТОЧНИК, не выдумывай сверх найденного) ===\n${parts.join('\n\n')}\n=== КОНЕЦ ФАКТУРЫ ===\n`;
}
