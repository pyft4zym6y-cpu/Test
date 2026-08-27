/**
 * Защита от SSRF на маршрутах, которые ходят по адресу от вызывающего.
 *
 * Контур assertPublic был написан для /api/fetch и работал. Но второй такой
 * маршрут — разбор страницы по критериям AQC — им не пользовался: он делал
 * fetch(url) напрямую, с redirect:'follow' и без единой проверки. При этом
 * тело ответа уходит в промпт, а цитаты из него возвращаются вызывающему в
 * поле evidence. То есть это был работающий сканер внутренней сети и способ
 * вычитать метаданные облака.
 *
 * Маршрут закрыт requireStaff, поэтому речь о повышении привилегий с учётки
 * сотрудника, а не об анонимной дыре. Но серверлес на Vercel — ровно та среда,
 * где 169.254.169.254 отдаёт учётные данные роли.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — JS-модуль без типов, здесь это и проверяется
import { assertPublic } from '../../../api/_lib/fetch.js';

const blocked = async (u: string) => {
  try { await assertPublic(new URL(u)); return null; }
  catch (e) { return String((e as Error).message); }
};

describe('assertPublic', () => {
  it('метаданные облака — главная цель SSRF в серверлесе', async () => {
    expect(await blocked('http://169.254.169.254/latest/meta-data/')).toBeTruthy();
  });

  it('loopback во всех видах', async () => {
    for (const u of ['http://localhost:8787/', 'http://127.0.0.1/', 'http://[::1]/']) {
      expect(await blocked(u), u).toBeTruthy();
    }
  });

  it('приватные диапазоны', async () => {
    for (const u of ['http://10.0.0.5/', 'http://172.16.0.1/', 'http://192.168.1.1/', 'http://100.64.0.1/']) {
      expect(await blocked(u), u).toBeTruthy();
    }
  });

  it('чужие схемы: file, gopher, data', async () => {
    for (const u of ['file:///etc/passwd', 'gopher://x/', 'data:text/plain,x']) {
      expect(await blocked(u), u).toBeTruthy();
    }
  });

  it('внутренние имена', async () => {
    for (const u of ['http://something.internal/', 'http://foo.local/']) {
      expect(await blocked(u), u).toBeTruthy();
    }
  });

  it('обычный публичный адрес проходит — иначе аудит перестал бы работать', async () => {
    expect(await blocked('https://weexp.agency/')).toBeNull();
  });
});

describe('маршрут AQC пользуется этим контуром', () => {
  const src = readFileSync(join(__dirname, '..', '..', '..', 'api', 'aqc.js'), 'utf8');

  it('адрес проверяется до запроса', () => {
    expect(src).toMatch(/await assertPublic\(current\)/);
  });

  it('редиректы разбираются вручную', () => {
    // С redirect:'follow' проверка первого адреса ничего не значит: открытый
    // редирект уводит куда угодно, и следующий хоп никто не смотрит.
    expect(src).toContain("redirect: 'manual'");
    expect(src).not.toContain("redirect: 'follow'");
  });

  it('каждый следующий хоп проверяется так же, как первый', () => {
    const hops = src.match(/await assertPublic\(/g) ?? [];
    expect(hops.length).toBeGreaterThanOrEqual(2);
  });

  it('число переходов ограничено', () => {
    expect(src).toMatch(/слишком много редиректов/);
  });

  it('битый JSON в items даёт 400 с причиной, а не 500', () => {
    // Разбор стоял вне try — исключение уходило необработанным.
    expect(src).toMatch(/items должен быть корректным JSON/);
  });
});
