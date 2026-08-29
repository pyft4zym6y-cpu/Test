/**
 * Вивантаження ВСЬОГО тексту сайту в один markdown із прив'язкою
 * «сторінка → блок → роль елемента».
 *
 * Знімаємо з реально відрендерених сторінок, а не з вихідників: текст живе в
 * десятках компонентів, частина складається з двомовних кортежів і масивів
 * даних, і зібрати його «читанням коду» означало б щоразу отримувати інший
 * результат. Браузер показує рівно те, що бачить людина.
 *
 * Запуск: node scripts/exportContent.mjs [http://127.0.0.1:8123] [out.md]
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://127.0.0.1:8123';
const OUT = process.argv[3] || join(ROOT, '..', 'CONTENT.md');

/** Маршрути беремо з мапи сайту — вона й так є джерелом правди для пошуку.
    Тягнемо по HTTP, а не з диска: тоді скрипт не залежить від того, звідки
    його запустили, і працює проти будь-якої збірки, включно з продакшеном. */
const sitemap = await (await fetch(BASE + '/sitemap.xml')).text();
const all = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const uk = all.filter((p) => !p.startsWith('/en')).sort();
const en = all.filter((p) => p.startsWith('/en')).sort();

/** Людські назви ролей — щоб таблиця читалась редактором, а не розробником. */
const ROLE = {
  H1: 'H1', H2: 'H2', H3: 'H3', H4: 'H4', H5: 'H5', H6: 'H6',
  P: 'Абзац', LI: 'Пункт', A: 'Посилання', BUTTON: 'Кнопка', SUMMARY: 'Акордеон',
  LABEL: 'Підпис поля', LEGEND: 'Легенда', TD: 'Комірка', TH: 'Заголовок стовпця',
  BLOCKQUOTE: 'Цитата', FIGCAPTION: 'Підпис', OPTION: 'Опція', TIME: 'Дата',
  B: 'Акцент', STRONG: 'Акцент', I: 'Курсив', EM: 'Акцент', SPAN: 'Текст',
  DT: 'Назва', DD: 'Значення', CODE: 'Код', PRE: 'Текст', SMALL: 'Дрібний текст',
};

const page$ = async (p, path) => {
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  return p.evaluate(() => {
    const BLOCK = new Set(['SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE', 'NAV', 'FORM', 'FIELDSET', 'DIALOG', 'DETAILS']);
    const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'TEMPLATE']);
    const seen = new Set();
    const out = [];

    const visible = (el) => {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    /** Назва блоку: тег + перший клас + власний заголовок, якщо є. */
    const blockName = (el) => {
      const cls = (el.className || '').toString().trim().split(/\s+/).filter(Boolean)[0] || '';
      const h = el.querySelector('h1, h2, h3, .sysx-kick, .adm-col-h');
      const title = h && h !== el ? (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70) : '';
      return { tag: el.tagName.toLowerCase(), cls, title };
    };

    const walk = (el, chain) => {
      if (SKIP.has(el.tagName.toUpperCase()) || !visible(el)) return;
      const next = BLOCK.has(el.tagName) || (el.className || '').toString().includes('sysx-scene')
        ? [...chain, blockName(el)] : chain;
      // Лист із текстом: у дитини немає власного текстового вмісту.
      const kids = [...el.children].filter((c) => !SKIP.has(c.tagName.toUpperCase()));
      const own = kids.every((c) => !(c.textContent || '').trim());
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const whole = /^(H[1-6]|P|LI|BUTTON|SUMMARY|LABEL|LEGEND|DT|DD|TD|TH|BLOCKQUOTE|FIGCAPTION|A)$/.test(el.tagName);
      if (text && (own || whole)) {
        const key = next.map((b) => b.cls).join('>') + '|' + el.tagName + '|' + text;
        if (!seen.has(key) && text.length > 1) {
          seen.add(key);
          out.push({ chain: next, role: el.tagName, text, href: el.getAttribute('href') || undefined });
        }
        if (own || whole) return;   // фразу вже взяли цілком — глибше не йдемо
      }
      for (const c of kids) walk(c, next);
    };

    walk(document.body, []);
    return { title: document.title, desc: document.querySelector('meta[name="description"]')?.content || '', items: out };
  });
};

const esc = (s) => s.replace(/\|/g, '\\|');

const render = (path, data, skipChains) => {
  const lines = [`\n## \`${path}\`\n`];
  lines.push(`**Title:** ${data.title}  `);
  if (data.desc) lines.push(`**Description:** ${data.desc}  `);
  lines.push('');
  let cur = '';
  for (const it of data.items) {
    const chain = it.chain.map((b) => b.cls || b.tag).join(' › ');
    if (skipChains && skipChains.some((c) => chain.startsWith(c))) continue;
    if (chain !== cur) {
      cur = chain;
      const last = it.chain[it.chain.length - 1];
      const label = last ? (last.title ? `${last.title}` : last.cls || last.tag) : 'без блоку';
      lines.push(`\n### ${label}\n`);
      lines.push(`\`${chain || 'body'}\`\n`);
      lines.push('| Роль | Текст |', '| --- | --- |');
    }
    const role = ROLE[it.role] || it.role.toLowerCase();
    lines.push(`| ${role} | ${esc(it.text)}${it.href && it.href !== '#' ? ` → \`${it.href}\`` : ''} |`);
  }
  return lines.join('\n');
};

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.route('**', (r) => (/127\.0\.0\.1|localhost/.test(r.request().url()) ? r.continue() : r.abort()));

// Наскрізні блоки (шапка, підвал, cookie) знімаємо один раз — далі пропускаємо.
const home = await page$(p, '/');
const SHARED = ['sysh-nav', 'sysh-tabs', 'sysh-sheet', 'sfoot', 'ckc', 'sysx-crumbs'];

let md = `# Контент сайту weexp.agency\n\nВивантажено ${new Date().toISOString().slice(0, 10)} з реально відрендерених сторінок.\n`;
md += `Структура: \`шлях сторінки\` → блок → роль елемента.\nШлях у бектіках під заголовком блоку — ланцюг CSS-класів, за яким блок можна знайти у верстці.\n`;
md += `\n---\n\n# Наскрізні елементи\n\nПовторюються на всіх сторінках і нижче більше не дублюються.\n`;
md += render('шапка · підвал · cookie', { title: '', desc: '', items: home.items.filter((i) => SHARED.some((c) => i.chain.map((b) => b.cls).join('>').includes(c))) }, null);

md += `\n\n---\n\n# Сторінки · українська (${uk.length})\n`;
for (const path of uk) md += render(path, path === '/' ? home : await page$(p, path), SHARED);

md += `\n\n---\n\n# Сторінки · англійська (${en.length})\n`;
for (const path of en) md += render(path, await page$(p, path), SHARED);

writeFileSync(OUT, md + '\n');
console.log('written', OUT, (md.length / 1024).toFixed(0) + ' KB', uk.length + en.length, 'сторінок');
await b.close();
