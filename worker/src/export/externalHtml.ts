/**
 * Рендеры внешнего контура: Аудит соцсетей, Внешний инфофон бренда,
 * Аудит отзывов (сайт + внешние площадки). Консалтинговый каркас reportShell.
 */
import { esc, doc, methodologySection, swSection, recsSection, conclusionSection } from './reportShell.js';
import type { SocialReport, MentionsReport, ReviewsReport } from '../externalAudits.js';

const cover = (kicker: string, verdict: string, client: string, takenAt: string, meta: [string, string][], note: string) => {
  const date = new Date(takenAt).toLocaleDateString('ru-RU');
  return `<section class="cover"><div class="cov-bar"></div><div class="cov-body">
    <div class="kicker">${esc(kicker)}</div><h1>${esc(verdict)}</h1>
    <div class="cov-meta">${[['Клиент', client], ['Дата', date], ...meta].map(([l, v]) => `<div><span class="lbl">${esc(l)}</span><span class="val">${esc(v)}</span></div>`).join('')}</div>
    <div class="coverage">${note}</div>
  </div></section>`;
};
const footer = (name: string, client: string, takenAt: string) => `<section class="block"><div class="footer">Commerce OS · ${esc(name)} · ${esc(client)} · ${new Date(takenAt).toLocaleDateString('ru-RU')}. Внешний слой — поисковый срез на дату аудита. Отсутствие данных не выдаётся за факт и не скрывается.</div></section>`;

export function renderSocialHtml(r: SocialReport): string {
  const rows = r.profiles.map((p) => `<tr>
    <td class="x-p">${esc(p.platform)}</td>
    <td class="x-st ${p.found === 'на сайте' ? 'ok' : p.found === 'поиском' ? 'check' : 'gap'}">${p.found === 'на сайте' ? '✓' : p.found === 'поиском' ? '◐' : '✕'} ${esc(p.found)}</td>
    <td class="x-u">${esc(p.url)}</td>
    <td class="x-a">${esc(p.activity)}</td>
    <td class="x-n">${esc(p.note)}</td>
  </tr>`).join('');
  const meth = methodologySection({
    goal: 'Определить, какие соцплатформы реально работают на витрину: привязаны ли профили, живы ли они, и не потерян ли уже накопленный актив аудитории.',
    sources: ['Обход витрины: внешние ссылки на соцпрофили со всех разобранных страниц', r.searched ? 'Внешний поиск профилей и базовой активности (web search)' : 'Внешний поиск: заблокирован в этом прогоне (нужен ключ API)'],
    scope: `${r.profiles.length} платформ × два слоя (привязка + внешний поиск); оценка активности — базовая.`,
    limits: 'Базовый уровень: наличие, привязка, порядок активности. Вовлечённость, контент и реклама — SMM-аудит на A1.',
  });
  const table = `<section class="block"><h2>Платформы: привязка и активность</h2>
    <p class="lead">«Поиском» — профиль существует, но с витрины на него нет ссылки: актив есть, на сайт не работает.</p>
    <table><thead><tr><th>Платформа</th><th>Статус</th><th>Профиль</th><th>Активность (базово)</th><th>Вывод</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  return doc(`Аудит соцсетей A0 · ${r.client}`,
    cover('Commerce OS · Аудит соцсетей (базово) · слой A0', r.verdict, r.client, r.takenAt, [['Привязано', `${r.linked}/${r.profiles.length}`]],
      '<b>Что это.</b> Базовый аудит соц-контура: какие платформы привязаны к витрине, какие профили существуют, но не привязаны, и жив ли каждый профиль. Соцсети для e-commerce — доверие нового покупателя, ретаргетинг и повторные касания.')
    + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'A1: SMM-аудит (вовлечённость, контент, реклама) + UTM-разметка для измеримости соц-трафика.') + footer('Аудит соцсетей A0', r.client, r.takenAt),
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
  const meth = methodologySection({
    goal: 'Свести, что и где пишут о бренде за пределами его сайта: тональность, площадки, есть ли негатив без ответа.',
    sources: [r.searched ? 'Web-поиск упоминаний бренда (СМИ, каталоги, форумы, маркетплейсы, отзовики)' : 'Web-поиск: заблокирован в этом прогоне (нужен ключ API)'],
    scope: `${r.mentions.length} упоминаний в своде; тональность и суть каждой записи.`,
    limits: 'Поисковый срез на дату — не полный мониторинг с историей. Упоминания в закрытых сообществах и мессенджерах не видны.',
  });
  const table = `<section class="block"><h2>Свод упоминаний</h2>
    ${r.mentions.length ? `<table><thead><tr><th>Площадка</th><th>Тип</th><th>Тон</th><th>Что пишут</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="lead">${r.searched ? 'Упоминаний за пределами сайта не найдено — инфофон пуст.' : 'Внешний слой заблокирован — свод собирается при доступном ключе API.'}</p>`}</section>`;
  return doc(`Внешний инфофон A0 · ${r.client}`,
    cover('Commerce OS · Внешний инфофон бренда · слой A0', r.verdict, r.client, r.takenAt, [['Упоминаний', String(r.mentions.length)]],
      '<b>Что это.</b> Что пишут о бренде в интернете и где: свод упоминаний с тональностью. Инфофон — это и репутация перед покупкой, и E-E-A-T сигнал для поисковых и AI-систем.')
    + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'A1: регулярный мониторинг упоминаний (квартальный повтор свода) + программа внешнего присутствия.') + footer('Внешний инфофон бренда A0', r.client, r.takenAt),
    `.x-p{font-weight:800;} .x-k{font-size:9px;color:var(--muted);white-space:nowrap;} .x-st{font-weight:700;white-space:nowrap;font-size:9px;} .x-st.ok{color:var(--ok);} .x-st.check{color:var(--check);} .x-st.gap{color:var(--gap);} .x-n{font-size:9.5px;color:#333;}`);
}

export function renderReviewsHtml(r: ReviewsReport): string {
  const rows = r.sources.map((s) => `<tr>
    <td class="x-p">${esc(s.place)}<span class="x-kind">${esc(s.kind)}</span></td>
    <td class="x-st ${/не найден|нет|заблокир/.test(s.status) ? 'gap' : 'ok'}">${esc(s.status)}</td>
    <td class="x-r">${esc(s.rating)}</td>
    <td class="x-c">${esc(s.count)}</td>
    <td class="x-n">${esc(s.note)}</td>
  </tr>`).join('');
  const meth = methodologySection({
    goal: 'Показать полную картину отзывов: что покупатель видит на сайте и что находит о магазине снаружи — и контролирует ли бренд эту картину.',
    sources: ['Обход витрины: блоки отзывов на разобранных страницах, разметка рейтингов, страница отзывов', r.searched ? 'Web-поиск внешних отзывов (карты, маркетплейсы, отзовики)' : 'Web-поиск: заблокирован (нужен ключ API)'],
    scope: `${r.sources.length} источников в двух слоях (сайт + внешние площадки).`,
    limits: 'Внешние рейтинги — срез на дату; подлинность отзывов не верифицируется. Управление репутацией — процесс A1.',
  });
  const table = `<section class="block"><h2>Источники отзывов: сайт и внешние площадки</h2>
    <p class="lead">Покупатель всегда находит отзывы — вопрос в том, какие и где. Задача бренда: собрать их на своём домене и управлять внешними.</p>
    <table><thead><tr><th>Источник</th><th>Статус</th><th>Рейтинг</th><th>Кол-во</th><th>Вывод</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  return doc(`Аудит отзывов A0 · ${r.client}`,
    cover('Commerce OS · Аудит отзывов · слой A0', r.verdict, r.client, r.takenAt, [['Источников', String(r.sources.length)]],
      '<b>Что это.</b> Отзывы в два слоя: на сайте (карточки, страница отзывов, разметка) и на внешних площадках (карты, маркетплейсы, отзовики). Социальное доказательство — самый дешёвый усилитель конверсии из существующих.')
    + meth + table + swSection(r.strengths, r.weaknesses) + recsSection(r.recommendations) + conclusionSection(r.conclusion, 'A1: контур сбора отзывов (пост-покупочные триггеры) + SLA ответов на внешних площадках.') + footer('Аудит отзывов A0', r.client, r.takenAt),
    `.x-p{font-weight:800;} .x-p .x-kind{display:block;font-weight:400;font-size:7.5px;color:var(--muted);text-transform:uppercase;} .x-st{font-weight:700;font-size:9px;white-space:nowrap;} .x-st.ok{color:var(--ok);} .x-st.gap{color:var(--gap);}
     .x-r{font-weight:800;white-space:nowrap;} .x-c{color:var(--muted);white-space:nowrap;} .x-n{font-size:9px;color:#333;}`);
}
