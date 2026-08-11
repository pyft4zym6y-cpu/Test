/**
 * Общий визуальный каркас всех клиентских PDF-отчётов A0 (единый стандарт A0 §6):
 * печатный CSS A4, палитра бренда, статусные цвета только для severity, бейджи
 * измерений, обёртка документа. Используется UX/UI Audit, Executive Diagnostic и
 * остальными аудитами сюиты — чтобы весь пакет выглядел как один документ.
 */
import { DIMS, type Dim } from '../pagereport.js';

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const dimBadges = (dims: Dim[]) => dims.map((d) => `<span class="dim" title="${esc(DIMS[d])}">${d}</span>`).join('');
export const scoreColor = (pct: number) => (pct >= 70 ? 'ok' : pct >= 45 ? 'check' : 'gap');

export const SHARED_CSS = `
  :root{--ink:#12161C;--muted:#5A6472;--line:#E4E7EC;--lime:#65A30D;--ok:#16a34a;--check:#d97706;--gap:#dc2626;--bg:#fff;--soft:#F7F8FA;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;color:var(--ink);background:var(--bg);font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.45;}
  @page{size:A4;margin:14mm 12mm;}
  h1{font-size:30px;line-height:1.15;margin:0 0 18px;font-weight:800;letter-spacing:-.5px;}
  h2{font-size:17px;margin:0 0 6px;font-weight:800;letter-spacing:-.2px;}
  h3{font-size:12px;margin:10px 0 4px;font-weight:700;}
  .lead{color:var(--muted);margin:0 0 8px;font-size:10.5px;}
  .ok{color:var(--ok);} .check{color:var(--check);} .gap{color:var(--gap);}
  .block{padding:14px 0;border-top:1px solid var(--line);page-break-inside:avoid;}
  .page{page-break-before:always;}
  /* cover */
  .cover{position:relative;min-height:250mm;padding:0;page-break-after:always;}
  .cov-bar{position:absolute;left:0;top:0;width:8px;height:100%;background:var(--lime);}
  .cov-body{padding:24px 6px 0 20px;}
  .kicker,.page-kicker{color:var(--lime);font-weight:700;text-transform:uppercase;letter-spacing:.6px;font-size:10px;margin-bottom:14px;}
  .cov-meta{display:flex;gap:34px;margin:22px 0 30px;}
  .cov-meta .lbl{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.5px;}
  .cov-meta .val{display:block;font-size:15px;font-weight:700;}
  .cov-score{display:flex;align-items:baseline;gap:16px;margin:8px 0 26px;}
  .cov-score .big{font-size:64px;font-weight:800;line-height:1;letter-spacing:-2px;}
  .cov-score .big span{font-size:26px;}
  .big-cap{color:var(--muted);font-size:12px;}
  .coverage{background:var(--soft);border-left:3px solid var(--lime);padding:12px 14px;border-radius:0 6px 6px 0;font-size:10px;color:#333;max-width:150mm;}
  table{width:100%;border-collapse:collapse;}
  th{font-size:8.5px;text-transform:uppercase;color:var(--muted);text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);letter-spacing:.3px;}
  td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;}
  .dim{display:inline-block;font-size:7px;font-weight:700;letter-spacing:.3px;color:#475467;background:#EEF1F4;border-radius:3px;padding:1px 3px;margin:1px 2px 1px 0;}
  .bar{display:block;width:100%;height:8px;background:var(--line);border-radius:5px;overflow:hidden;min-width:110px;}
  .fill{display:block;height:100%;border-radius:5px;} .fill.ok{background:var(--ok);} .fill.check{background:var(--check);} .fill.gap{background:var(--gap);}
  .footer{margin-top:16px;padding-top:8px;border-top:1px solid var(--line);color:var(--muted);font-size:8.5px;}
  /* conclusion card (A0 §8) */
  .concl{border:1px solid var(--line);border-left:4px solid var(--lime);border-radius:0 6px 6px 0;padding:10px 12px;margin:8px 0;page-break-inside:avoid;}
  .concl.crit{border-left-color:var(--gap);} .concl.warn{border-left-color:var(--check);}
  .concl h3{margin:0 0 6px;font-size:13px;}
  .concl-grid{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:10px;}
  .concl-grid .k{color:var(--muted);white-space:nowrap;} .concl-grid .v{color:#222;}
  /* status chips */
  .chip{display:inline-block;font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid var(--line);background:var(--soft);margin:1px 3px 1px 0;}
  .chip.ok{color:var(--ok);} .chip.check{color:var(--check);} .chip.gap{color:var(--gap);}
  .chip.done{color:var(--ok);border-color:var(--ok);} .chip.partial{color:var(--check);border-color:var(--check);} .chip.blocked{color:var(--gap);border-color:var(--gap);}
`;

export function doc(title: string, bodyHtml: string, extraCss = ''): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${SHARED_CSS}${extraCss}</style></head><body>${bodyHtml}</body></html>`;
}
