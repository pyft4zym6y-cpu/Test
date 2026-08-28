/**
 * Content-Security-Policy живёт в корневом vercel.json — отдельно от кода,
 * который она защищает. Разъезжается это молча в обе стороны: добавили
 * интеграцию — она тихо не работает в проде; убрали — политика годами
 * разрешает лишнее.
 *
 * `connect-src` был `'self' https:`, то есть XSS мог отправить данные клиента
 * на любой https-хост. Дыры это не создавало (в script-src нет unsafe-inline),
 * но и защиты не давало никакой: директива с таким значением эквивалентна её
 * отсутствию.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cfg = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'vercel.json'), 'utf8'));
const csp: string = cfg.headers
  .flatMap((h: { headers: { key: string; value: string }[] }) => h.headers)
  .find((h: { key: string }) => h.key === 'Content-Security-Policy')?.value ?? '';
const directive = (name: string) =>
  (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? '').slice(name.length + 1);

describe('CSP', () => {
  it('заголовок вообще есть', () => {
    expect(csp).toBeTruthy();
  });

  it('connect-src не разрешает весь https — иначе директивы всё равно что нет', () => {
    const c = directive('connect-src').split(/\s+/);
    expect(c).not.toContain('https:');
    expect(c).not.toContain('*');
  });

  it('Supabase разрешён — и REST, и realtime', () => {
    // supa.ts подписывается через .channel(), это WebSocket: без wss админка
    // теряет живое обновление, и заметно это станет не сразу.
    const c = directive('connect-src');
    expect(c).toMatch(/https:\/\/\*\.supabase\.co/);
    expect(c).toMatch(/wss:\/\/\*\.supabase\.co/);
  });

  it('всё, что грузится скриптом, разрешено и в connect-src', () => {
    // Turnstile тянет свой чэлендж XHR-ом с того же хоста, с которого пришёл скрипт.
    const scripts = directive('script-src').split(/\s+/).filter((s) => s.startsWith('https://'));
    const connect = directive('connect-src');
    const turnstile = scripts.find((s) => s.includes('cloudflare'));
    expect(turnstile, 'в script-src нет Turnstile — проверьте, не убрали ли его').toBeTruthy();
    expect(connect).toContain(turnstile!);
  });

  it('инлайновые скрипты по-прежнему запрещены — на этом держится всё остальное', () => {
    expect(directive('script-src')).not.toContain("'unsafe-inline'");
    expect(directive('script-src')).not.toContain("'unsafe-eval'");
  });

  it('object-src и base-uri закрыты', () => {
    expect(directive('object-src')).toBe("'none'");
    expect(directive('base-uri')).toBe("'self'");
  });
});


describe('интерактивное остаётся интерактивным', () => {
  /*
   * Сцены скролл-фильма гасят события (pointer-events: none), чтобы мышь
   * доставала WebGL-объект позади. Возвращало их правило ТОЛЬКО для <a> —
   * поэтому кнопка «Поділитися» на /proof была мертва: две соседние ссылки
   * работали, она нет. Визуально не отличить: нажимаешь, ничего не происходит.
   */
  const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8');

  it('возврат событий написан не только для ссылок', () => {
    const restore = css.match(/[^}]*pointer-events: *auto[^}]*/g) || [];
    const scene = restore.find((r) => r.includes('sysx-scene'));
    expect(scene, 'в .sysx-scene нет правила, возвращающего pointer-events').toBeTruthy();
    for (const tag of ['button', 'input', 'select', 'textarea']) {
      expect(scene, `сцена не возвращает события для <${tag}>`).toContain(tag);
    }
  });

  it('гашение событий всегда парно с возвратом', () => {
    // Каждый класс, который гасит события у ЦЕЛОГО блока с содержимым,
    // должен иметь парное правило возврата для управляющих элементов.
    /*
     * Разбираем по блокам, а не одной сквозной регуляркой: правило возврата
     * написано списком селекторов через запятую, и глобальный поиск съедал
     * первый вместе со вторым — .cf-act во втором селекторе не находился.
     */
    const killers: string[] = [];
    const restored = new Set<string>();
    for (const block of css.split('}')) {
      const i = block.lastIndexOf('{');
      if (i < 0) continue;
      const selector = block.slice(0, i);
      const body = block.slice(i + 1);
      const classes = [...selector.matchAll(/\.([a-z0-9-]+)/g)].map((m) => m[1]);
      if (/pointer-events: *none/.test(body)) killers.push(...classes);
      if (/pointer-events: *auto/.test(body)) for (const c of classes) restored.add(c);
    }
    // .cf-act и .sysx-scene держат контент с кнопками — их проверяем строго.
    for (const k of ['cf-act', 'sysx-scene']) {
      if (!killers.includes(k)) continue;
      expect(restored.has(k), `.${k} гасит события и ничего не возвращает`).toBe(true);
    }
  });
});
