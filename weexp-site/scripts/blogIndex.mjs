#!/usr/bin/env node
/**
 * Легкий індекс статей із повних JSON-файлів.
 *
 * Навіщо окремий крок: тіла лонгридів не мають потрапляти в спільний бандл, а
 * списки статей потрібні одразу — на кожній сторінці сайту, у хабі й у карті
 * сайту. Vite не вміє взяти «частину JSON», тому індекс збирається тут.
 *
 * Друга причина — та сама правда в двох форматах. Раніше подібне закінчувалось
 * тим, що перелік у застосунку й перелік у статиці розходились. Тут джерело
 * одне: файли в src/content/blog. Індекс — похідна, і його не редагують руками
 * (тест перевіряє, що він збігається з файлами).
 *
 * Запуск: node scripts/blogIndex.mjs   (сам викликається у prebuild)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'src', 'content', 'blog');
const OUT = join(ROOT, 'src', 'data', 'blog-index.json');

/** Поля, які потрібні спискам. Тіло статті сюди не входить — у цьому весь сенс. */
const LIGHT = ['slug', 'title', 'description', 'keywords', 'category', 'pages', 'published', 'readMin'];

const files = (await readdir(DIR).catch(() => [])).filter((f) => f.endsWith('.json')).sort();
const index = [];
const problems = [];

for (const f of files) {
  const raw = await readFile(join(DIR, f), 'utf8');
  let a;
  try { a = JSON.parse(raw); } catch (e) { problems.push(`${f}: не JSON — ${e.message}`); continue; }

  // Імʼя файлу і slug мають збігатись: інакше стаття доступна за однією
  // адресою, а посилаються на неї за іншою, і половина посилань веде у 404.
  const want = f.replace(/\.json$/, '');
  if (a.slug !== want) problems.push(`${f}: slug «${a.slug}» не збігається з іменем файлу`);

  for (const k of LIGHT) if (a[k] === undefined) problems.push(`${f}: немає поля ${k}`);
  index.push(Object.fromEntries(LIGHT.map((k) => [k, a[k]])));
}

if (problems.length) {
  console.error('blog-index: ' + problems.length + ' проблем\n  ' + problems.join('\n  '));
  process.exit(1);
}

index.sort((a, b) => (a.published < b.published ? 1 : -1));
await writeFile(OUT, JSON.stringify(index, null, 2) + '\n');
console.log(`blog-index: ${index.length} статей → src/data/blog-index.json`);
