/**
 * IndexNow — уведомление Bing, Yandex, Seznam и Naver об изменившихся адресах.
 * Google протокол не поддерживает: там работают только sitemap и обычный обход.
 *
 * Включается наличием ключа: INDEXNOW_KEY в окружении сборки. Без ключа скрипт
 * молча ничего не делает и говорит об этом — чтобы «настроено» и «не настроено»
 * не выглядели одинаково.
 *
 * Ключ обязан лежать по адресу https://weexp.agency/<KEY>.txt и содержать сам
 * ключ — иначе поисковик отклонит заявку. Файл генерируется здесь же, на сборке,
 * поэтому разойтись с переменной окружения он не может.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'dist';
const HOST = 'weexp.agency';
const KEY = process.env.INDEXNOW_KEY || '';

if (!KEY) {
  console.log('indexnow: ключ не задан (INDEXNOW_KEY) — уведомление пропущено');
  process.exit(0);
}
if (!/^[a-zA-Z0-9-]{8,128}$/.test(KEY)) {
  console.error('indexnow: ключ должен быть 8–128 символов [a-zA-Z0-9-] — уведомление пропущено');
  process.exit(0);
}

// Файл-подтверждение владения
fs.writeFileSync(path.join(OUT, `${KEY}.txt`), KEY);

const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
}).catch((e) => ({ ok: false, status: 0, statusText: String(e).slice(0, 80) }));

// 200 — принято, 202 — принято, ключ проверяется. Всё прочее — отказ, и о нём
// надо знать: молчащая отправка ничем не отличается от неотправленной.
if (res.ok) console.log(`indexnow: отправлено ${urlList.length} адресов (HTTP ${res.status})`);
else console.error(`indexnow: ОТКАЗ HTTP ${res.status} ${res.statusText || ''} — адреса не поданы`);
