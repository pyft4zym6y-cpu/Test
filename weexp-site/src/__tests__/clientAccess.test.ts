/**
 * Гарды эндпоинта, который заводит клиентам доступ в сервис ведения проекта.
 *
 * Это самая опасная точка из всего, что здесь есть: у эндпоинта в руках
 * service_role-ключ Supabase, то есть право делать с любым аккаунтом что
 * угодно. Ошибка в гарде здесь — не «неудобно», а «менеджер забрал доступ
 * супер-админа».
 *
 * Тест читает исходник, а не гоняет HTTP: развернуть Supabase здесь нельзя, а
 * молчаливое «тест не запустился» хуже отсутствия теста. Поэтому проверяем
 * инварианты, которые видно в коде и которые ломаются именно правкой:
 * что ключ не утёк в бандл, что роль не выдаётся, что аккаунты команды
 * недосягаемы, и что цель проверяется по базе, а не по телу запроса.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const src = readFileSync(join(ROOT, 'api', 'client-access.js'), 'utf8');
/** Тело без комментариев: гарды — это код, а не рассказ о коде. */
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('сервисный ключ не покидает сервер', () => {
  it('читается только из process.env, без VITE-префикса', () => {
    expect(code).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY');
    // VITE_ попадает в бандл — там сервисному ключу конец всей базе.
    expect(code, 'service_role через VITE_ уедет в JS клиента')
      .not.toMatch(/VITE_[A-Z_]*SERVICE_ROLE/);
  });

  it('ключ не уходит в ответ клиенту', () => {
    // Ловим то, чем это бывает: попадание переменной ключа в res.json.
    for (const m of code.matchAll(/res\.status\(\d+\)\.json\(([^;]*)\)/g)) {
      expect(m[1], 'ключ в теле ответа').not.toMatch(/\bSRK\b/);
    }
  });

  it('ни один фронтовый файл не знает про service_role', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
    const bad = walk(join(ROOT, 'weexp-site', 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('__tests__'))
      .filter((f) => /SERVICE_ROLE/.test(readFileSync(f, 'utf8')));
    expect(bad, 'сервисный ключ упомянут во фронтенде').toEqual([]);
  });
});

describe('эндпоинт не выдаёт ролей', () => {
  it('не пишет app_metadata ни в одном действии', () => {
    /*
     * Клиент — это пользователь БЕЗ роли. Если сюда добавить app_metadata,
     * менеджер получит способ выдать роль — себе в том числе, — а ролями
     * распоряжается только super через /api/team.
     */
    expect(code, 'появилась запись app_metadata — это путь повышения привилегий')
      .not.toMatch(/app_metadata\s*:/);
  });

  it('роль читается, но только чтобы отказать', () => {
    // Чтение роли цели нужно для гарда; важно, что оно не превращается в запись.
    expect(code).toMatch(/app_metadata\?\.\s*role/);
  });
});

describe('аккаунты команды недосягаемы', () => {
  it('гард объявлен и роль цели берётся из базы, а не из тела запроса', () => {
    expect(code).toMatch(/const refuseIfStaff/);
    // Именно target из findByEmail: проверять b.email и действовать по b.userId —
    // ровно та ошибка, которая уже была найдена в /api/team.
    expect(code).toMatch(/refuseIfStaff\s*=\s*\(target\)/);
    expect(code).toMatch(/target\?\.\s*app_metadata\?\.\s*role/);
  });

  it('каждое изменяющее действие проходит через гард', () => {
    /*
     * Проверяем не «гард существует», а что его вызывают ВО ВСЕХ ветках,
     * которые что-то меняют. Гард, забытый в одной ветке, — то же самое, что
     * его отсутствие: атакующий просто выберет ту ветку.
     */
    const actions = ['create', 'set_password', 'revoke'];
    for (const a of actions) {
      const at = code.indexOf(`a === '${a}'`);
      expect(at, `ветка ${a} не найдена`).toBeGreaterThan(-1);
      // Границей берём следующее `if (a ===` или конец файла.
      const nextIf = code.indexOf("if (a === '", at + 5);
      const branch = code.slice(at, nextIf > 0 ? nextIf : code.length);
      expect(branch, `в ветке ${a} нет refuseIfStaff`).toContain('refuseIfStaff(');
    }
  });

  it('гард стоит до действия, а не после', () => {
    // Отказ после создания пользователя означает, что пользователь уже создан.
    for (const a of ['create', 'set_password', 'revoke']) {
      const at = code.indexOf(`a === '${a}'`);
      const nextIf = code.indexOf("if (a === '", at + 5);
      const branch = code.slice(at, nextIf > 0 ? nextIf : code.length);
      const guard = branch.indexOf('refuseIfStaff(');
      const act = branch.search(/admin\(['`]\/users/);
      expect(guard, `${a}: гард не найден`).toBeGreaterThan(-1);
      expect(act, `${a}: действие не найдено`).toBeGreaterThan(-1);
      expect(guard, `${a}: гард стоит после действия`).toBeLessThan(act);
    }
  });
});

describe('вызывать может только команда', () => {
  it('стоит requireStaff, а не requireUser', () => {
    // requireUser пустил бы сюда любого залогиненного — в том числе клиента,
    // который тогда завёл бы доступ кому угодно.
    expect(code).toContain('requireStaff(req, res)');
    expect(code).not.toContain('requireUser(');
  });

  it('только POST', () => {
    expect(code).toMatch(/req\.method !== 'POST'/);
  });

  it('писем сервис не шлёт вообще', () => {
    /*
     * Ни приглашений, ни писем со сменой пароля: доступ не должен зависеть от
     * настроенного SMTP и от того, дошло ли письмо. Заодно исчезает открытый
     * редирект — redirect_to передавать больше некуда.
     */
    expect(code, 'вернулись приглашения письмом').not.toMatch(/auth\/v1\/invite/);
    expect(code, 'вернулись письма со сменой пароля').not.toMatch(/auth\/v1\/recover/);
    expect(code, 'вернулся redirect_to из писем').not.toMatch(/redirect_to/);
  });

  it('значение пароля не попадает в журнал', () => {
    /*
     * Журнал читает вся команда: значение пароля там жить не должно. Ищем
     * именно ПОДСТАНОВКУ значения, а не слово «password»: имя события
     * client_password содержит его законно, и первая версия проверки падала
     * на нём — тест ловил собственную формулировку, а не утечку.
     */
    const at = code.indexOf("a === 'set_password'");
    const branch = code.slice(at, code.indexOf("if (a === '", at + 5) || code.length);
    const call = branch.match(/journal\([^)]*\)/)?.[0] ?? '';
    expect(call, 'журнал не пишется вовсе').toBeTruthy();
    expect(call, 'значение пароля уходит в журнал').not.toMatch(/\$\{[^}]*(password|pwd)/i);
  });
});

describe('что видит клиент в сервисе', () => {
  const cabinet = readFileSync(join(ROOT, 'weexp-site', 'src', 'system', 'Cabinet.tsx'), 'utf8');

  it('вход по паролю есть и он первый', () => {
    const form = cabinet.indexOf('cab-signin');
    const google = cabinet.indexOf('cab-google-lg');
    expect(form, 'формы входа по паролю нет').toBeGreaterThan(-1);
    expect(form, 'Google стоит выше пароля').toBeLessThan(google);
  });

  it('локальный режим не пускают внутрь сервиса', () => {
    /*
     * signInWithEmail умеет упасть в локальный режим, когда Supabase
     * недоступен. На сайте это спасало сессию, здесь — наоборот: человек
     * увидел бы «вошли» и пустой проект вместо своего.
     */
    expect(cabinet).toMatch(/if \(r\.local \|\| !r\.user\)/);
  });

  it('саморегистрации в сервисе нет', () => {
    expect(cabinet, 'вернулась регистрация — сервис перестал быть закрытым')
      .not.toMatch(/registerWithEmail/);
  });
});

describe('пароли задаются вручную', () => {
  const panelSrc = readFileSync(join(ROOT, 'weexp-site', 'src', 'system', 'admin', 'ClientAccessPanel.tsx'), 'utf8');
  // Без комментариев: первая версия проверки падала на фразе «Пароль із crypto,
  // а не з Math.random» — то есть ловила объяснение, почему так не делают.
  const panel = panelSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('генератор берёт crypto, а не Math.random', () => {
    /*
     * Math.random не криптографический: последовательность предсказуема, и
     * пароли, выданные подряд, связаны между собой. Для того, что открывает
     * данные клиента, это не годится.
     */
    expect(panel).toContain('crypto.getRandomValues');
    expect(panel, 'вернулся Math.random в генераторе пароля').not.toMatch(/Math\.random/);
  });

  it('в алфавите нет символов, которые путают при диктовке', () => {
    const alphabet = /const A = '([^']+)'/.exec(panel)?.[1] ?? '';
    expect(alphabet, 'алфавит не найден').toBeTruthy();
    for (const ch of ['0', 'O', '1', 'l', 'I']) {
      expect(alphabet, `«${ch}» путают при диктовке`).not.toContain(ch);
    }
    expect(alphabet.length, 'слишком бедный алфавит').toBeGreaterThan(40);
  });

  it('минимальная длина одна и та же в UI и на сервере', () => {
    // Разойдись они — форма разрешит пароль, который сервер отвергнет, и
    // менеджер получит непонятную ошибку вместо подсказки.
    const uiMin = Number(/PWD_MIN = (\d+)/.exec(panel)?.[1]);
    expect(uiMin, 'PWD_MIN не найден').toBeGreaterThan(0);
    expect(code, `сервер ждёт не ${uiMin} символов`).toContain(`.length < ${uiMin}`);
  });
});
