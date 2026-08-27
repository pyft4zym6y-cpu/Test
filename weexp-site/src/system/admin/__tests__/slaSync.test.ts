/**
 * Пороги SLA живуть у двох місцях: в адмінці (`auditRequests.ts`) і в щоденному
 * кроні (`api/sla.js`). Об'єднати їх одним імпортом не виходить — це два різні
 * збирачі, Vite і serverless, і спільний модуль коштував би більше, ніж
 * розв'язує.
 *
 * Тому синхронність тримає цей тест. Раніше на її місці стояв коментар «пороги
 * мають збігатися» — і саме так вони й розійшлись: в адмінці два рівні, у кроні
 * був один. Коментар нічого не перевіряє; тест перевіряє.
 *
 * Читаємо файл крона текстом навмисно: імпортувати `api/sla.js` не можна —
 * модуль на верхньому рівні чіпає оточення Vercel. Нам потрібні тільки числа.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SLA } from '../auditRequests';

const CRON = join(process.cwd(), '..', 'api', 'sla.js');

/** Витягти літерал `const SLA = {...}` з тексту крона. */
function cronThresholds(): Record<string, { warn: number; breach: number }> {
  const src = readFileSync(CRON, 'utf8');
  const m = src.match(/const SLA = \{([\s\S]*?)\n\};/);
  if (!m) throw new Error('у api/sla.js не знайдено літерал SLA — тест треба оновити разом із файлом');
  const out: Record<string, { warn: number; breach: number }> = {};
  for (const line of m[1].split('\n')) {
    const r = line.match(/(\w+):\s*\{\s*warn:\s*(\d+),\s*breach:\s*(\d+)\s*\}/);
    if (r) out[r[1]] = { warn: Number(r[2]), breach: Number(r[3]) };
  }
  return out;
}

describe('SLA: адмінка і крон', () => {
  const cron = cronThresholds();

  /*
   * Пороги — не єдине, що дублюється. Годинник теж: обидві копії рахують, як
   * довго стадія стоїть. І обидві однаково помилялись — брали `updatedAt`,
   * який бумкає на будь-якому записі, зокрема на автозбереженні профілю самим
   * клієнтом. Замір: заявка стоїть дев'ять днів при нормативі два, а клієнт
   * щодня дописує профіль — обидві копії показували 0 днів і «в нормі».
   *
   * Тепер `updatedAt` лише запасний, для старих записів без позначок руху.
   * Тест тримає це в кроні текстом: щойно він знову опиниться серед основних
   * джерел, перевірка впаде.
   */
  it('годинник крона рахує рух стадії, а не будь-який запис', () => {
    const src = readFileSync(CRON, 'utf8');
    const m = src.match(/function moveStamps\(rec\) \{([\s\S]*?)\n\}/);
    expect(m, 'у api/sla.js не знайдено moveStamps — тест треба оновити разом із файлом').toBeTruthy();
    expect(m![1], 'updatedAt серед основних джерел годинника').not.toMatch(/updatedAt/);
    // а серед джерел мають бути саме позначки руху
    expect(m![1]).toMatch(/tierHistory/);
    expect(m![1]).toMatch(/deepModeration/);
    expect(m![1]).toMatch(/auditClosedAt/);
  });

  it('крон відсіює непридатні дати так само, як адмінка', () => {
    const src = readFileSync(CRON, 'utf8');
    expect(src, 'зіпсована позначка дасть NaN і тихо випаде з перевірки').toMatch(/Number\.isNaN\(Date\.parse/);
    expect(src, 'записи без годинника мають рахуватись окремо').toMatch(/noClock/);
  });

  it('крон має всі стадії, які знає адмінка (крім «відхилено»)', () => {
    const ui = Object.keys(SLA).filter((k) => k !== 'denied');
    expect(Object.keys(cron).sort()).toEqual(ui.sort());
  });

  it('значення збігаються до числа — і warn, і breach', () => {
    for (const [stage, v] of Object.entries(cron)) {
      const uiv = SLA[stage as keyof typeof SLA];
      expect({ stage, ...v }).toEqual({ stage, warn: uiv.warn, breach: uiv.breach });
    }
  });

  it('«відхилено» у крон не потрапляє: воно не зависає за визначенням', () => {
    expect(cron.denied).toBeUndefined();
  });

  it('warn завжди раніше breach — інакше попередження безглузде', () => {
    for (const [stage, v] of Object.entries(cron)) {
      expect(v.warn, `стадія ${stage}`).toBeLessThan(v.breach);
    }
  });

  it('крон розрізняє два рівні, а не шле лист лише коли вже пізно', () => {
    const src = readFileSync(CRON, 'utf8');
    expect(src).toMatch(/SLA\[st\]\.warn/);
    expect(src).toMatch(/SLA\[st\]\.breach/);
  });

  it('лист називає відповідального: інакше власник має сам розбирати, кого штовхати', () => {
    expect(readFileSync(CRON, 'utf8')).toMatch(/pmOf/);
  });
});
