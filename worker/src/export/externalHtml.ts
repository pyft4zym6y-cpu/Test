/**
 * Рендеры внешнего контура: Аудит соцсетей, Внешний инфофон бренда,
 * Аудит отзывов (сайт + внешние площадки). Консалтинговый каркас reportShell.
 */
import { esc, doc, cover, pageFooter, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import { svgDonut, svgGauge } from './charts.js';
import type { SocialReport, MentionsReport, ReviewsReport } from '../externalAudits.js';

export function renderSocialHtml(r: SocialReport): string {
  const coverHtml = cover({
    kicker: 'Соцконтур бренду',
    title: 'Аудит соцмереж',
    verdict: r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Прив’язано', value: `${r.linked}/${r.profiles.length}` }],
    note: '<b>Що це.</b> Базовий аудит соц-контуру: які платформи прив’язані до вітрини, які профілі існують, але не прив’язані, і чи живий кожен профіль. Соцмережі для e-commerce — довіра нового покупця, ретаргетинг і повторні дотики.',
  });
  const rows = r.profiles.map((p) => `<tr>
    <td class="x-p">${esc(p.platform)}</td>
    <td class="x-st ${p.found === 'на сайті' ? 'ok' : p.found === 'пошуком' ? 'check' : 'gap'}">${p.found === 'на сайті' ? '✓' : p.found === 'пошуком' ? '◐' : '✕'} ${esc(p.found)}</td>
    <td class="x-u">${esc(p.url)}</td>
    <td class="x-a">${esc(p.activity)}</td>
    <td class="x-n">${esc(p.note)}</td>
  </tr>`).join('');
  const meth = methodologySection({
    goal: 'Визначити, які соцплатформи реально працюють на вітрину: чи прив’язані профілі, чи живі вони, і чи не втрачений уже накопичений актив аудиторії.',
    sources: ['Обхід вітрини: зовнішні посилання на соцпрофілі з усіх розібраних сторінок', r.searched ? 'Зовнішній пошук профілів і базової активності (web search)' : 'Зовнішній пошук: заблоковано в цьому прогоні (потрібен ключ API)'],
    scope: `${r.profiles.length} платформ × два шари (прив’язка + зовнішній пошук); оцінка активності — базова.`,
    limits: 'Базовий рівень: наявність, прив’язка, порядок активності. Залученість, контент і реклама — SMM-аудит після передачі доступів (наступний етап).',
  });
  const statusDonut = r.profiles.length ? `<div class="chart-wrap">${svgDonut([
    { label: 'Прив’язаний до сайту', value: r.profiles.filter((p) => p.found === 'на сайті').length, color: '#16a34a' },
    { label: 'Знайдений пошуком', value: r.profiles.filter((p) => p.found === 'пошуком').length, color: '#d97706' },
    { label: 'Не знайдений', value: r.profiles.filter((p) => p.found === 'не знайдено').length, color: '#dc2626' },
  ].filter((x) => x.value > 0), { title: 'Платформи за статусом прив’язки', centerLabel: `${r.linked}/${r.profiles.length}` })}
    <p class="chart-cap">Зелений — профіль прив’язаний до вітрини; помаранчевий — існує, але з сайту не прив’язаний (актив втрачається); червоний — присутність не виявлено.<sup class="fn">1</sup></p></div>` : '';
  const table = `<section class="block"><h2>Платформи: прив’язка й активність</h2>
    <p class="lead">«Пошуком» — профіль існує, але з вітрини на нього немає посилання: актив є, на сайт не працює.</p>
    ${statusDonut}
    <table><thead><tr><th>Платформа</th><th>Статус</th><th>Профіль</th><th>Активність (базово)</th><th>Висновок</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="fn-note"><sup>1</sup> Статус — з обходу вітрини (наявність прив’язки) і зовнішнього пошуку на дату аудиту. «Не знайдений» означає відсутність сліду в обході й пошуку, а не гарантовану відсутність профілю.</p></section>`;
  return doc(`Аудит соцмереж · ${r.client}`,
    coverHtml + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'Наступний етап: SMM-аудит (залученість, контент, реклама) + UTM-розмітка для вимірності соц-трафіку.') + pageFooter('Зовнішній шар — пошуковий зріз на дату аудиту. Відсутність даних не видається за факт і не приховується.'),
    `.x-p{font-weight:800;white-space:nowrap;} .x-st{font-weight:700;white-space:nowrap;font-size:9px;} .x-st.ok{color:var(--ok);} .x-st.check{color:var(--check);} .x-st.gap{color:var(--gap);}
     .x-u{font-size:8.5px;color:var(--muted);word-break:break-all;} .x-a{font-size:9px;color:#333;} .x-n{font-size:9px;color:#333;}`);
}

export function renderMentionsHtml(r: MentionsReport): string {
  const TONE: Record<string, string> = { 'позитив': 'ok', 'нейтрально': 'check', 'негатив': 'gap', 'н/д': 'check' };
  const rows = r.mentions.map((m) => `<tr>
    <td class="x-p">${esc(m.source)}</td>
    <td class="x-k">${esc(m.kind)}</td>
    <td class="x-st ${TONE[m.tone] ?? 'check'}">${esc(m.tone)}</td>
    <td class="x-n">${esc(m.what)}</td>
  </tr>`).join('');
  const coverHtml = cover({
    kicker: 'Репутація в інтернеті',
    title: 'Зовнішній інфофон',
    verdict: r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Згадок', value: r.searched ? String(r.mentions.length) : 'N/A — пошук не виконано' }],
    note: '<b>Що це.</b> Що пишуть про бренд в інтернеті і де: зведення згадок із тональністю. Інфофон — це і репутація перед покупкою, і E-E-A-T сигнал для пошукових та AI-систем.',
  });
  const meth = methodologySection({
    goal: 'Звести, що і де пишуть про бренд за межами його сайту: тональність, майданчики, чи є негатив без відповіді.',
    sources: [r.searched ? 'Web-пошук згадок бренду (ЗМІ, каталоги, форуми, маркетплейси, відгукові сайти)' : 'Web-пошук: заблоковано в цьому прогоні (потрібен ключ API)'],
    scope: `${r.mentions.length} згадок у зведенні; тональність і суть кожного запису.`,
    limits: 'Пошуковий зріз на дату — не повний моніторинг з історією. Згадки в закритих спільнотах і месенджерах не видно.',
  });
  const totalM = r.mentions.length;
  const posM = r.mentions.filter((m) => m.tone === 'позитив').length;
  const negM = r.mentions.filter((m) => m.tone === 'негатив').length;
  const neuM = totalM - posM - negM;
  const sentimentDonut = totalM > 0 ? `<div class="chart-wrap">${svgDonut([
    { label: 'Позитив', value: posM, color: '#16a34a' },
    { label: 'Нейтрал', value: neuM, color: '#64748b' },
    { label: 'Негатив', value: negM, color: '#dc2626' },
  ].filter((x) => x.value > 0), { title: 'Тональність згадок', centerLabel: String(totalM) })}
    <p class="chart-cap">Розподіл тональності за ${totalM} згадками; негатив без відповіді бренду — пріоритет реакції.<sup class="fn">1</sup></p></div>` : '';
  const table = `<section class="block"><h2>Зведення згадок</h2>
    ${sentimentDonut}
    ${r.mentions.length ? `<table><thead><tr><th>Майданчик</th><th>Тип</th><th>Тон</th><th>Що пишуть</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="lead">${r.searched ? 'Згадок за межами сайту не знайдено — інфофон порожній.' : 'Зовнішній шар заблоковано — зведення збирається за доступного ключа API.'}</p>`}
    ${totalM > 0 ? '<p class="fn-note"><sup>1</sup> Тональність — експертна оцінка зовнішніх згадок на дату аудиту (пошуковий зріз), не верифіковані метрики майданчиків; «нейтрал» включає записи без явного забарвлення.</p>' : ''}</section>`;
  return doc(`Зовнішній інфофон · ${r.client}`,
    coverHtml + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'Наступний етап: регулярний моніторинг згадок (квартальний повтор зведення) + програма зовнішньої присутності.') + pageFooter('Зовнішній шар — пошуковий зріз на дату аудиту. Відсутність даних не видається за факт і не приховується.'),
    `.x-p{font-weight:800;} .x-k{font-size:9px;color:var(--muted);white-space:nowrap;} .x-st{font-weight:700;white-space:nowrap;font-size:9px;} .x-st.ok{color:var(--ok);} .x-st.check{color:var(--check);} .x-st.gap{color:var(--gap);} .x-n{font-size:9.5px;color:#333;}`);
}

export function renderReviewsHtml(r: ReviewsReport): string {
  const rows = r.sources.map((s) => `<tr>
    <td class="x-p">${esc(s.place)}<span class="x-kind">${esc(s.kind)}</span></td>
    <td class="x-st ${/не знайден|немає|заблоков/.test(s.status) ? 'gap' : 'ok'}">${esc(s.status)}</td>
    <td class="x-r">${esc(s.rating)}</td>
    <td class="x-c">${esc(s.count)}</td>
    <td class="x-n">${esc(s.note)}</td>
  </tr>`).join('');
  const coverHtml = cover({
    kicker: 'Соціальний доказ',
    title: 'Аудит відгуків',
    verdict: r.verdict,
    metrics: [{ label: 'Клієнт', value: r.client }, { label: 'Джерел', value: String(r.sources.length) }],
    note: '<b>Що це.</b> Відгуки у два шари: на сайті (картки, сторінка відгуків, розмітка) і на зовнішніх майданчиках (карти, маркетплейси, відгукові сайти). Соціальний доказ — найдешевший підсилювач конверсії з наявних.',
  });
  const meth = methodologySection({
    goal: 'Показати повну картину відгуків: що покупець бачить на сайті і що знаходить про магазин ззовні — і чи контролює бренд цю картину.',
    sources: ['Обхід вітрини: блоки відгуків на розібраних сторінках, розмітка рейтингів, сторінка відгуків', r.searched ? 'Web-пошук зовнішніх відгуків (карти, маркетплейси, відгукові сайти)' : 'Web-пошук: заблоковано (потрібен ключ API)'],
    scope: `${r.sources.length} джерел у двох шарах (сайт + зовнішні майданчики).`,
    limits: 'Зовнішні рейтинги — зріз на дату; справжність відгуків не верифікується. Управління репутацією — процес наступного етапу (після передачі доступів).',
  });
  const ratedExt = r.sources.filter((s) => s.kind === 'зовнішній').map((s) => {
    const m = /(\d+(?:[.,]\d+)?)/.exec(s.rating);
    return m ? parseFloat(m[1].replace(',', '.')) : NaN;
  }).filter((v) => v > 0 && v <= 5);
  const avgRating = ratedExt.length ? Math.round((ratedExt.reduce((a, b) => a + b, 0) / ratedExt.length) * 10) / 10 : 0;
  const ratingGauge = ratedExt.length ? `<div class="chart-wrap">${svgGauge(avgRating, { max: 5, label: 'сер. зовнішній рейтинг', tone: avgRating >= 4 ? 'ok' : avgRating >= 3 ? 'check' : 'gap' })}
    <p class="chart-cap">Середній рейтинг за ${ratedExt.length} зовнішніми майданчиками з розпізнаною оцінкою (шкала 0–5).<sup class="fn">1</sup></p></div>` : '';
  const table = `<section class="block"><h2>Джерела відгуків: сайт і зовнішні майданчики</h2>
    <p class="lead">Покупець завжди знаходить відгуки — питання в тому, які й де. Завдання бренду: зібрати їх на своєму домені і керувати зовнішніми.</p>
    ${ratingGauge}
    <table><thead><tr><th>Джерело</th><th>Статус</th><th>Рейтинг</th><th>К-сть</th><th>Висновок</th></tr></thead><tbody>${rows}</tbody></table>
    ${ratedExt.length ? '<p class="fn-note"><sup>1</sup> Рейтинг — пошуковий зріз на дату аудиту, усереднений за майданчиками з розпізнаною оцінкою; методики майданчиків і справжність відгуків не верифікуються.</p>' : ''}</section>`;
  return doc(`Аудит відгуків · ${r.client}`,
    coverHtml + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'Наступний етап: контур збору відгуків (постпокупкові тригери) + SLA відповідей на зовнішніх майданчиках.') + pageFooter('Зовнішній шар — пошуковий зріз на дату аудиту. Відсутність даних не видається за факт і не приховується.'),
    `.x-p{font-weight:800;} .x-p .x-kind{display:block;font-weight:400;font-size:7.5px;color:var(--muted);text-transform:uppercase;} .x-st{font-weight:700;font-size:9px;white-space:nowrap;} .x-st.ok{color:var(--ok);} .x-st.gap{color:var(--gap);}
     .x-r{font-weight:800;white-space:nowrap;} .x-c{color:var(--muted);white-space:nowrap;} .x-n{font-size:9px;color:#333;}`);
}
