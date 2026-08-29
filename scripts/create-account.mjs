#!/usr/bin/env node
/**
 * Створити обліковий запис у сервісі ведення проєкту — з командного рядка.
 *
 * Навіщо окремий скрипт: перший адміністратор нізвідки не береться. Заводити
 * клієнтів уміє консоль сервісу, але щоб у неї увійти, потрібен акаунт із
 * паролем, а зробити його з UI нема кому. Це та сама операція, тільки перша.
 *
 * Чому не «бутстрап-ендпоінт»: адреса, яка створює адміністратора, рано чи
 * пізно виявляється відкритою. Разову дію робимо разовим інструментом, який
 * вимагає ключ на руках — тобто доступ до консолі Supabase.
 *
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role> \
 *   node scripts/create-account.mjs --email you@weexp.agency --role super
 *
 * Пароль скрипт питає в терміналі й не приймає аргументом: аргументи видно в
 * `ps` і вони лишаються в історії оболонки. Без --role створюється КЛІЄНТ —
 * користувач без ролі; ролі команди вимагають писати їх явно.
 */
import { createInterface } from 'node:readline';
import { stdin, stdout, env, argv, exit } from 'node:process';

const ROLES = ['super', 'admin', 'manager', 'auditor'];

const arg = (name) => {
  const i = argv.indexOf('--' + name);
  return i > -1 ? argv[i + 1] : undefined;
};

const URL = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SRK = env.SUPABASE_SERVICE_ROLE_KEY;
const email = String(arg('email') || '').trim().toLowerCase();
const role = arg('role');

if (!URL || !SRK) {
  console.error('Потрібні SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role).');
  exit(1);
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Вкажіть --email (він же логін).');
  exit(1);
}
if (role && !ROLES.includes(role)) {
  console.error(`--role має бути одним із: ${ROLES.join(', ')}. Без --role створюється клієнт.`);
  exit(1);
}

/** Питає пароль без відлуння: інакше він лишається на екрані й у скролбеку. */
const askPassword = () => new Promise((resolve) => {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  stdout.write('Пароль (мінімум 10 символів, не буде видно): ');
  const wasRaw = stdin.isTTY;
  if (wasRaw) stdin.setRawMode?.(true);
  let buf = '';
  const onData = (ch) => {
    const s = String(ch);
    // Явні коди, а не літерали: керівні символи не переживають копіювання —
    // перша версія порівнювала з порожнім рядком, і backspace із Ctrl+C просто
    // не працювали, мовчки додаючись у пароль.
    if (s === '\n' || s === '\r' || s === '\u0004') {
      if (wasRaw) stdin.setRawMode?.(false);
      stdin.off('data', onData); rl.close(); stdout.write('\n'); resolve(buf);
      return;
    }
    if (s === '\u0003') {                    // Ctrl+C
      if (wasRaw) stdin.setRawMode?.(false);
      stdout.write('\n'); exit(130);
    }
    if (s === '\u007f' || s === '\b') { buf = buf.slice(0, -1); return; }
    buf += s;
  };
  stdin.on('data', onData);
});

const password = await askPassword();
if (password.length < 10) { console.error('Пароль закороткий — мінімум 10 символів.'); exit(1); }

const admin = (path, opts = {}) => fetch(`${URL}/auth/v1/admin${path}`, {
  ...opts,
  headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'content-type': 'application/json', ...(opts.headers || {}) },
});

// Чи існує вже такий акаунт: тоді не створюємо другий, а ставимо пароль.
const found = await admin(`/users?per_page=200`).then((r) => r.json()).catch(() => null);
const existing = (found?.users || found || []).find((u) => String(u.email || '').toLowerCase() === email);

const body = { password, ...(role ? { app_metadata: { role } } : {}) };
const res = existing
  ? await admin(`/users/${existing.id}`, { method: 'PUT', body: JSON.stringify(body) })
  : await admin('/users', { method: 'POST', body: JSON.stringify({ email, email_confirm: true, ...body }) });

const j = await res.json().catch(() => null);
if (!j?.id) {
  console.error('Не вдалося:', j?.msg || j?.error_description || j?.error || res.status);
  exit(1);
}
console.log(`${existing ? '✓ Оновлено' : '✓ Створено'}: ${j.email}${role ? ` · роль ${role}` : ' · клієнт (без ролі)'}`);
console.log(`Увійти: https://app.weexp.agency/cabinet${role ? ' → далі /manage' : ''}`);
