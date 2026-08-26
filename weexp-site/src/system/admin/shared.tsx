
import { Link } from 'react-router-dom';
import {
  getProjects,
  type AccessState,
  MANAGER_EMAILS,
  can,
  MATURITY_DOMAIN_MODULE,
  type Role,
  type AdminRow,
  type LeadRow,
  type TierStatus,
  type LeadStatus
} from '@/lib/supa';

import { toast } from '@/lib/toast';

import { type Block } from '../auditTemplate';

import '../system.css';
import '../cabinet.css';

/** Домен рушія → ключ нашого модуля (реекспорт для UI імпорту зрілості). */
export const MATURITY_MODULE_OF = MATURITY_DOMAIN_MODULE;
/** Короткі підписи модулів A–P для рядків імпорту зрілості. */
export const MOD_LABEL: Record<string, string> = {
  business: '01 Business', market: '02 Market', product: '03 Product', customer: '04 Customer',
  website: '05 Website', seo: '06 SEO/GEO', acquisition: '07 Acquisition', crm: '08 CRM/Retention',
  analytics: '09 Analytics', operations: '10 Operations', technology: '11 Technology', organization: '12 Organization',
};

/**
 * /admin — операційна адмінка (єдиний кокпіт власника): дашборд, користувачі,
 * аудити, доступи T1–T4, заявки, налаштування. Дані — з Supabase (`diagnostics`,
 * `leads`). Доступ — лише акаунтам зі списку MANAGER_EMAILS (+ RLS-політика).
 * Контент сайту редагується окремо (зовнішня CMS) — тут операції, не тексти.
 */
export type SiteTraffic = {
  period?: string; sessions?: number; users?: number; pageviews?: number; bounceRate?: number;
  sources?: { name: string; sessions: number }[]; pages?: { path: string; views: number }[]; error?: string;
};
export type Tab = 'overview' | 'leads' | 'auditreq' | 'express' | 'builder' | 'pm' | 'users' | 'worker' | 'settings';
export type Cap = Parameters<typeof can>[1];
// Структура меню. Один життєвий цикл клієнта — один розділ: «Аудит і проєкти».
// Експрес-аудит (те, що було до заявки), конструктор анкети й довідник ставок —
// другий рівень під ним, бо всі троє існують заради нього. Окремої вкладки
// «Аудити» більше немає: вона показувала ту саму воронку іншими словами.
export const TABS: { id: Tab; label: string; cap: Cap; sub?: { id: Tab; label: string; cap: Cap }[] }[] = [
  { id: 'overview', label: 'Дашборд', cap: 'view_dashboard' },
  { id: 'leads', label: 'Заявки', cap: 'view_leads' },
  {
    id: 'auditreq', label: 'Аудит і проєкти', cap: 'view_audits', sub: [
      { id: 'express', label: 'Експрес-аудити', cap: 'view_audits' },
      { id: 'builder', label: 'Конструктор аудиту', cap: 'edit_template' },
      { id: 'pm', label: 'Команда і ставки', cap: 'manage_pm' },
    ],
  },
  { id: 'users', label: 'Користувачі', cap: 'view_users' },
  { id: 'worker', label: 'Воркер', cap: 'view_audits' },
  { id: 'settings', label: 'Налаштування', cap: 'manage_settings' },
];

// Джерела заявок, що є запитами доступу (не первинна комунікація).
export const ACCESS_SOURCES = ['cabinet-access', 'cabinet-deep'];
export const SRC_LABEL: Record<string, string> = {
  'calc-order-audit': 'Експрес-аудит (заявка)',
  'contact': 'Контакти',
  'contact-form': 'Контакти',
  'cabinet-access': 'Кабінет · запит доступу',
  'cabinet-deep': 'Кабінет · глибокий аудит',
  'pricing': 'Початок співпраці',
  'diagnose': 'Експрес-аудит',
};
export const srcName = (s?: string | null): string => (s && (SRC_LABEL[s] || s)) || 'без мітки';

export const CAP_SUMMARY: Record<Role, string> = {
  super: 'усе + команда',
  admin: 'клієнти · аудити · заявки · проекти · конструктор',
  manager: 'клієнти · аудити · заявки',
  auditor: 'лише аудити',
};
export const ST: Record<TierStatus | 'none', { txt: string; cls: string }> = {
  none: { txt: 'Не запрошено', cls: 'none' }, requested: { txt: 'Очікує', cls: 'wait' },
  data: { txt: 'Потрібні дані', cls: 'wait' }, granted: { txt: 'Надано', cls: 'ok' }, rejected: { txt: 'Відхилено', cls: 'bad' },
};

// Статуси заявки (адмін керує вручну). Легасі-статуси старих записів
// (proposal/won/lost) відображаються у найближчий новий.
export const LEAD_STAGES: { k: LeadStatus; l: string; cls: string }[] = [
  { k: 'new', l: 'Нова', cls: 'wait' },
  { k: 'qualified', l: 'Кваліфікована', cls: 'ok' },
  { k: 'unqualified', l: 'Некваліфікована', cls: 'bad' },
  { k: 'progress', l: 'В роботі', cls: 'wait' },
  { k: 'done', l: 'Завершена', cls: 'ok' },
  { k: 'archive', l: 'Архів', cls: 'none' },
];
// Типи співпраці для чек-листа угоди в картці заявки.
export const COOP_TYPES: { k: string; l: string }[] = [
  { k: 'audit', l: 'Аудит' },
  { k: 'consulting', l: 'Консалтинг' },
  { k: 'full', l: 'Повний супровід' },
  { k: 'other', l: 'Інше' },
];
export const coopLabel = (k?: string) => COOP_TYPES.find((c) => c.k === k)?.l || k || '';
export const stageOf = (l: LeadRow): LeadStatus => {
  const s = l.status || 'new';
  return s === 'proposal' ? 'progress' : s === 'won' ? 'done' : s === 'lost' ? 'unqualified' : s;
};
// Клієнту показуємо єдину послугу «Глибокий аудит» (ключ DEEP). Старі T1–T4 — легасі.
export const tierLabel = (tid: string) => (tid === 'DEEP' ? 'Глибокий аудит' : tid);

// ── Єдина клієнтська воронка (Аудити): стадія виводиться з даних клієнта ──
export type FunnelStage = 'registered' | 'express' | 'requested' | 'awaiting_data' | 'in_work' | 'project';
export const FUNNEL: { k: FunnelStage; l: string; cls: string }[] = [
  { k: 'registered', l: 'Зареєстрований', cls: 'none' },
  { k: 'express', l: 'Експрес пройдено', cls: 'ok' },
  { k: 'requested', l: 'Запит на глибокий', cls: 'wait' },
  { k: 'awaiting_data', l: 'Очікуються дані', cls: 'wait' },
  { k: 'in_work', l: 'Аудит у роботі', cls: 'ok' },
  { k: 'project', l: 'Проект', cls: 'ok' },
];
export const funnelStage = (r: AdminRow): FunnelStage => {
  const ts = Object.values(r.funnel?.tierStatus || {});
  if (getProjects(r.record).length) return 'project';
  if (r.hasDeep || ts.includes('granted')) return 'in_work';
  if (ts.includes('data')) return 'awaiting_data';
  if (ts.includes('requested')) return 'requested';
  if (r.hasExpress) return 'express';
  return 'registered';
};

/** Відносна дата: «щойно», «5 хв», «3 год», «2 дн», далі — дата. */
export function rel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return 'щойно';
  if (s < 3600) return `${Math.floor(s / 60)} хв`;
  if (s < 86400) return `${Math.floor(s / 3600)} год`;
  if (s < 604800) return `${Math.floor(s / 86400)} дн`;
  try { return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }); } catch { return ''; }
}

export function Tile({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return <div className={`adm-tile${accent ? ' accent' : ''}`}><b className="adm-tile-n">{n}</b><span className="adm-tile-l">{l}</span></div>;
}

export const fmtVal = (v: unknown): string => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') { const o = v as { name?: string }; return o.name ? `📎 ${o.name}` : JSON.stringify(v); }
  return String(v);
};
export const relT = (iso?: string) => {
  if (!iso) return ''; const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'щойно'; if (s < 3600) return `${Math.floor(s / 60)} хв`; if (s < 86400) return `${Math.floor(s / 3600)} год`;
  try { return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }); } catch { return ''; }
};

/** Realtime-подача заповнення спільного аудиту (адмінка): що заповнено + автор. */

/**
 * Порожній стан має пояснювати систему, а не констатувати порожнечу. Новий
 * менеджер інакше не дізнається ні що статуси похідні, ні звідки беруться
 * картки, ні який крок його.
 */
export function EmptyState({ icon, text, hint }: { icon: string; text: string; hint?: string }) {
  return (
    <div className="adm-empty-box">
      <span className="adm-empty-ic" aria-hidden="true">{icon}</span>
      <p className="mono">{text}</p>
      {hint && <p className="mono adm-empty-hint">{hint}</p>}
    </div>
  );
}

export function Trend({ data }: { data: { t0: number; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((s, d) => s + d.n, 0);
  return (
    <div className="adm-panel adm-trend">
      <span className="adm-col-h mono">Активність по днях · {total} подій</span>
      <div className="adm-trend-bars">
        {data.map((d, i) => (
          <span key={i} className={`adm-trend-bar${d.n > 0 ? ' has' : ''}`} style={{ height: `${d.n ? Math.max(Math.round((d.n / max) * 100), 6) : 2}%` }}
            title={`${new Date(d.t0).toLocaleDateString('uk-UA')}: ${d.n}`} />
        ))}
      </div>
    </div>
  );
}

export function TrafficBlock({ t }: { t: SiteTraffic | null | undefined }) {
  if (t === undefined) return <div className="adm-traffic"><span className="sysx-kick">Трафік сайту · GA4</span><p className="mono adm-hint">Завантаження…</p></div>;
  if (t === null || t.error) return (
    <div className="adm-traffic">
      <span className="sysx-kick">Трафік сайту · GA4</span>
      <p className="mono adm-hint">{t?.error || 'Дані трафіку недоступні тут (працює на проді). Потрібні env GA4_SITE_PROPERTY_ID / GA4_SA_EMAIL / GA4_SA_KEY у Vercel.'}</p>
    </div>
  );
  const nf = (n?: number) => (n ?? 0).toLocaleString('uk-UA');
  return (
    <div className="adm-traffic">
      <span className="sysx-kick">Трафік сайту · GA4 · {t.period || '30 днів'}</span>
      <div className="adm-tiles">
        <Tile n={t.sessions ?? 0} l="Сесій" />
        <Tile n={t.users ?? 0} l="Користувачів" />
        <Tile n={t.pageviews ?? 0} l="Переглядів" />
        <div className="adm-tile"><b className="adm-tile-n">{t.bounceRate ?? 0}%</b><span className="adm-tile-l">Показник відмов</span></div>
      </div>
      <div className="adm-traffic-cols">
        <div className="adm-traffic-col">
          <span className="adm-col-h mono">Джерела</span>
          {(t.sources || []).length === 0 ? <p className="mono adm-empty">—</p> : (t.sources || []).map((s) => (
            <div key={s.name} className="adm-bar-row"><span className="adm-bar-l">{s.name}</span><span className="adm-bar-v mono">{nf(s.sessions)}</span></div>
          ))}
        </div>
        <div className="adm-traffic-col">
          <span className="adm-col-h mono">Топ сторінок</span>
          {(t.pages || []).length === 0 ? <p className="mono adm-empty">—</p> : (t.pages || []).map((p) => (
            <div key={p.path} className="adm-bar-row"><span className="adm-bar-l mono">{p.path}</span><span className="adm-bar-v mono">{nf(p.views)}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Брендоване PDF-досьє клієнта — самодостатня друкована сторінка (нова вкладка → друк/зберегти в PDF). */

// Вкладка «Глибокий аудит» тримала девʼять важких блоків одночасно — від
// запуску рушія до редактора документа. Це і стіна в інтерфейсі, і найбільший
// чанк адмінки. Розбито за ходом роботи: спершу збираємо дані, потім працюємо,
// потім складаємо документи.
export type UTab = 'over' | 'kb' | 'comp' | 'express' | 'data' | 'work' | 'pack' | 'docs' | 'team' | 'proj';
export const U_TABS: { id: UTab; l: string; hint?: string }[] = [
  { id: 'over', l: 'Огляд' },
  { id: 'kb', l: 'База знань' },
  { id: 'comp', l: 'Компанія' },
  { id: 'express', l: 'Експрес-аудит' },
  { id: 'data', l: 'Аудит · дані', hint: 'доступи, анкета, уточнення, модерація' },
  { id: 'work', l: 'Аудит · робота', hint: 'прогін рушія та оцінка модулів' },
  { id: 'pack', l: 'Аудит · пакет', hint: 'чек-лист звітів і документ аудиту' },
  { id: 'docs', l: 'Документи' },
  { id: 'team', l: 'Команда' },
  { id: 'proj', l: 'Проект' },
];

export const PM_MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
export function gMonthLabel(startMonth: string | undefined, i: number): string {
  const m = /^(\d{4})-(\d{1,2})$/.exec(startMonth || '');
  if (!m) return `М${i + 1}`;
  const base = Number(m[1]) * 12 + (Number(m[2]) - 1) + i;
  return `${PM_MONTHS[base % 12]} ${String(Math.floor(base / 12)).slice(2)}`;
}

/** Проект-офіс: глобальний довідник команди та ставок (переиспользується в проектах). */
export const ACCESS_STATUS: { v: NonNullable<AccessState['status']>; l: string; cls: string }[] = [
  { v: 'requested', l: 'Запрошено', cls: 'wait' }, { v: 'granted', l: 'Надано', cls: 'ok' },
  { v: 'verified', l: 'Перевірено', cls: 'ok' }, { v: 'na', l: 'Не потрібно', cls: 'none' },
];
/** Каталог доступів клієнта: 3 способи (перегляд-пошта / OAuth / вивантаження), статус, інструкція, нотатка. */

/**
 * Куди віддати згенерований документ замість нового вікна.
 *
 * Генератори пакета (карта доступів, Ганта, план 90 днів, DoD, передача справ,
 * досьє) вміли тільки відкрити вікно на друк. Щоб документ дійшов до клієнта,
 * менеджер друкував його в PDF і завантажував назад руками — той самий останній
 * метр, який для прогонів рушія вже закритий. Тут генератор можна попросити
 * віддати HTML, а не показати: далі його кладуть у файли клієнта.
 */
let DOC_SINK: ((html: string, title: string) => void) | null = null;
export async function captureDoc(run: () => void | Promise<void>): Promise<{ html: string; title: string } | null> {
  let out: { html: string; title: string } | null = null;
  DOC_SINK = (html, title) => { out = { html, title }; };
  try { await run(); } finally { DOC_SINK = null; }
  return out;
}

export function openPrintDoc(title: string, email: string, bodyHtml: string) {
  const now = new Date().toLocaleString('uk-UA');
  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${title}</title><style>
@page{margin:16mm}body{font-family:"IBM Plex Sans","Segoe UI",system-ui,Arial,sans-serif;color:#141210;margin:0;font-size:13px;line-height:1.55}
.bar{height:8px;background:#F5301C}.wrap{padding:26px 30px;max-width:860px}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #141210;padding-bottom:12px;margin-bottom:18px}
.logo{font-weight:800;font-size:22px}.logo span{color:#F5301C}.meta{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#6B675E;text-align:right}
h1{font-size:20px;margin:2px 0 14px}h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#F5301C;margin:20px 0 8px;border-bottom:1px solid #E3D9C0;padding-bottom:4px}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #EEE7D6;padding:6px 8px;vertical-align:top;text-align:left;font-size:12.5px}
th{color:#6B675E;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.muted{color:#9a9488}.ok{color:#177A43;font-weight:700}.warn{color:#C0851E;font-weight:700}
.foot{margin-top:26px;padding-top:12px;border-top:1px solid #E3D9C0;color:#9a9488;font-size:10.5px}
@media print{.noprint{display:none}}
</style></head><body><div class="bar"></div><div class="wrap">
<div class="top"><div><div class="logo">WEEXP<span>.</span></div><div style="font-family:monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B675E">Глибокий аудит · документ пакета</div></div>
<div class="meta">${email}<br>сформовано ${now}</div></div>
<h1>${title}</h1>
<button class="noprint" onclick="window.print()" style="margin:0 0 14px;background:#F5301C;color:#fff;border:0;border-radius:6px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer">🖨 Друк / зберегти в PDF</button>
${bodyHtml}
<div class="foot">WEEXP — Commerce OS · weexp.agency · hello@weexp.agency · Конфіденційно, не для розповсюдження.</div>
</div></body></html>`;
  if (DOC_SINK) { DOC_SINK(html, title); return; }
  const w = window.open('', '_blank');
  if (!w) { toast('Дозвольте спливаючі вікна, щоб відкрити документ', 'err'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
export const escH = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** a02 — Карта доступів і даних: каталог × статус клієнта. */

export const ALL_ROLES: Role[] = ['super', 'admin', 'manager', 'auditor'];
/** Керування командою через серверний /api/team (лише Super Admin). */

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="sysx adm"><div className="adm-in"><Link to="/" className="mc-back mono">← weexp.agency</Link>{children}</div></div>;
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="adm-block"><span className="sysx-kick">{title}</span>{children}</div>;
}

/**
 * Однаковий індикатор збереження для всіх редакторів: стан, причина помилки і
 * кнопка «Повторити». Раніше кожен редактор показував свій «✕» без пояснень.
 */
export function SaveBadge({ state, error, savedAt, onRetry }: { state: SaveState; error?: string; savedAt?: string; onRetry?: () => void }) {
  if (state === 'idle') return null;
  const txt = state === 'saving' ? '💾 Збереження…'
    : state === 'dirty' ? '● Є незбережені зміни'
    : state === 'saved' ? `✓ Збережено${savedAt ? ' ' + savedAt : ''}`
    : `✕ ${error || 'Не збережено'}`;
  return (
    <span className={`pj-save-state pj-save-${state}`} role="status" aria-live="polite">
      {txt}
      {state === 'error' && onRetry && <button className="mc-btn sm ghost adm-retry" onClick={onRetry}>Повторити</button>}
    </span>
  );
}
