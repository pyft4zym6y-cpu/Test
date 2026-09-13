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
import { readFileSync, readdirSync } from 'node:fs';
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
   * Сцены скролл-фильма гасили события (pointer-events: none) у ЦЕЛОГО блока
   * с текстом и кнопками, чтобы мышь доставала WebGL-объект позади. Возврат
   * был написан только для <a> — поэтому кнопка «Поділитися» на /proof была
   * мертва: две соседние ссылки работали, она нет. Визуально не отличить:
   * нажимаешь, и ничего не происходит.
   *
   * Сцен больше нет — страница обычная, и гасить события у контента незачем.
   * Но приём остался доступным, и сторож теперь стережёт само ПРАВИЛО, а не
   * ту пару селекторов: слой, который гасит события, обязан быть декоративным
   * (aria-hidden), состоянием «выключено» — или возвращать события управляющим
   * элементам. Иначе он однажды снова накроет собой живую кнопку.
   */
  /*
   * Комментарии вырезаем ДО разбора. Первая версия сторожа их не вырезала —
   * и упала на комментарии, который объяснял, почему `pointer-events: none`
   * отсюда убрали: инструмент читал прозу вместо кода.
   */
  const css = readFileSync(join(__dirname, '..', 'system', 'system.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const tsx = readdirSync(join(__dirname, '..', 'system'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(join(__dirname, '..', 'system', f), 'utf8'))
    .join('\n');

  /** Селекторы «выключенного состояния» — там мёртвость и есть смысл. */
  const isDisabledState = (sel: string) => /\[disabled\]|:disabled|\.is-off|\.is-disabled/.test(sel);

  it('ни один слой не гасит события над живой кнопкой', () => {
    const killers: { cls: string; sel: string }[] = [];
    const restored = new Set<string>();
    for (const block of css.split('}')) {
      const i = block.lastIndexOf('{');
      if (i < 0) continue;
      const sel = block.slice(0, i);
      const body = block.slice(i + 1);
      const classes = [...sel.matchAll(/\.([a-z0-9-]+)/g)].map((m) => m[1]);
      if (/pointer-events: *none/.test(body) && !isDisabledState(sel))
        for (const c of classes) killers.push({ cls: c, sel: sel.trim() });
      if (/pointer-events: *auto/.test(body)) for (const c of classes) restored.add(c);
    }
    expect(killers.length, 'правил с pointer-events: none не нашлось вовсе — сторож ничего не проверяет')
      .toBeGreaterThan(0);

    /*
     * Возврат событий бывает написан не на самом слое, а на его содержимом:
     * `.ckc` (полоса согласия на cookie) гасит события на всю ширину экрана,
     * а `.ckc-card` внутри возвращает их карточке с кнопками. Это и есть
     * правильный приём — слой ничего не перекрывает, живёт только карточка.
     * Первая версия сторожа искала класс в класс и такую пару не видела.
     */
    const paired = (cls: string) => restored.has(cls) || [...restored].some((r) => r.startsWith(cls + '-'));

    for (const { cls } of killers) {
      if (paired(cls)) continue;                             // события возвращают явно
      // Иначе слой обязан быть декоративным: каждый его экземпляр в разметке
      // помечен aria-hidden на том же теге.
      const uses = [...tsx.matchAll(new RegExp(`<[a-zA-Z][^>]*className=[^>]*\\b${cls}\\b[^>]*>`, 'g'))].map((m) => m[0]);
      for (const tag of uses) {
        expect(tag.includes('aria-hidden'), `.${cls} гасит события, но это не декоративный слой: ${tag.slice(0, 90)}`)
          .toBe(true);
      }
    }
  });
});
