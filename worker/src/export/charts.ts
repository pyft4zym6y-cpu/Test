/**
 * Самодостаточные SVG-диаграммы для отчётов (без внешних библиотек, рендерятся в PDF
 * через Chromium). Тема согласована с SHARED_CSS (--ok/--check/--gap/--ink/--muted).
 * Все функции возвращают строку <svg…>. Устойчивы к пустым данным.
 */
import { esc } from './reportShell.js';

const PAL = ['#65A30D', '#0F9488', '#d97706', '#dc2626', '#6d28d9', '#0369a1', '#db2777', '#64748b'];
const toneColor = (t?: string) => t === 'ok' ? '#16a34a' : t === 'check' ? '#d97706' : t === 'gap' ? '#dc2626' : '#64748b';

/* ── Горизонтальные столбцы: [{label, value, max?, tone?, note?}] ── */
export function svgBars(rows: { label: string; value: number; max?: number; tone?: string; note?: string }[], opts: { w?: number; title?: string; unit?: string } = {}): string {
  if (!rows.length) return '';
  const w = opts.w ?? 520, rowH = 22, padL = 150, padR = 54, top = opts.title ? 24 : 6;
  const h = top + rows.length * rowH + 6;
  const max = Math.max(1, ...rows.map((r) => r.max ?? r.value));
  const barW = w - padL - padR;
  const bars = rows.map((r, i) => {
    const y = top + i * rowH;
    const bw = Math.max(1, Math.round((r.value / max) * barW));
    const c = toneColor(r.tone);
    return `<text x="${padL - 8}" y="${y + 13}" text-anchor="end" font-size="9" fill="#334155">${esc(r.label.slice(0, 26))}</text>
      <rect x="${padL}" y="${y + 4}" width="${barW}" height="11" rx="3" fill="#eef1f4"/>
      <rect x="${padL}" y="${y + 4}" width="${bw}" height="11" rx="3" fill="${c}"/>
      <text x="${padL + barW + 6}" y="${y + 13}" font-size="9" font-weight="700" fill="#1f2937">${esc(String(r.value))}${esc(opts.unit ?? '')}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px" xmlns="http://www.w3.org/2000/svg">
    ${opts.title ? `<text x="0" y="14" font-size="11" font-weight="800" fill="#12161c">${esc(opts.title)}</text>` : ''}${bars}</svg>`;
}

/* ── Пончик: [{label, value, tone?/color?}] + легенда ── */
export function svgDonut(segs: { label: string; value: number; tone?: string; color?: string }[], opts: { size?: number; title?: string; centerLabel?: string } = {}): string {
  const total = segs.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return '';
  const size = opts.size ?? 150, r = size / 2, ir = r * 0.6, cx = r, cy = r;
  let a0 = -Math.PI / 2;
  const arcs = segs.map((s, i) => {
    const frac = s.value / total, a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi0 = cx + ir * Math.cos(a1), yi0 = cy + ir * Math.sin(a1), xi1 = cx + ir * Math.cos(a0), yi1 = cy + ir * Math.sin(a0);
    const col = s.color ?? (s.tone ? toneColor(s.tone) : PAL[i % PAL.length]);
    a0 = a1;
    return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${xi0.toFixed(1)},${yi0.toFixed(1)} A${ir},${ir} 0 ${large} 0 ${xi1.toFixed(1)},${yi1.toFixed(1)} Z" fill="${col}"/>`;
  }).join('');
  const legend = segs.map((s, i) => `<div style="display:flex;align-items:center;gap:5px;font-size:9px;margin:2px 0"><span style="width:9px;height:9px;border-radius:2px;background:${s.color ?? (s.tone ? toneColor(s.tone) : PAL[i % PAL.length])};display:inline-block"></span>${esc(s.label)} — <b>${s.value}</b></div>`).join('');
  return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${arcs}
      ${opts.centerLabel ? `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="15" font-weight="800" fill="#12161c">${esc(opts.centerLabel)}</text>` : ''}</svg>
    <div>${opts.title ? `<div style="font-size:11px;font-weight:800;margin-bottom:4px">${esc(opts.title)}</div>` : ''}${legend}</div></div>`;
}

/* ── Радар: [{axis, value}] на шкале 0..max ── */
export function svgRadar(axes: { axis: string; value: number }[], opts: { size?: number; max?: number; title?: string } = {}): string {
  if (axes.length < 3) return '';
  const size = opts.size ?? 260, max = opts.max ?? 5, r = size / 2 - 34, cx = size / 2, cy = size / 2;
  const n = axes.length;
  const pt = (i: number, val: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; const rr = (val / max) * r; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; };
  const grid = [1, 2, 3, 4, 5].filter((g) => g <= max).map((g) => {
    const pts = axes.map((_, i) => pt(i, g).map((v) => v.toFixed(1)).join(',')).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#e4e7ec" stroke-width="0.7"/>`;
  }).join('');
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, max); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e4e7ec" stroke-width="0.7"/>`; }).join('');
  const poly = axes.map((a, i) => pt(i, a.value).map((v) => v.toFixed(1)).join(',')).join(' ');
  const labels = axes.map((a, i) => { const [x, y] = pt(i, max * 1.16); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="8" fill="#475467">${esc(a.axis.slice(0, 16))}</text>`; }).join('');
  const dots = axes.map((a, i) => { const [x, y] = pt(i, a.value); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#65A30D"/>`; }).join('');
  // Заголовок — HTML над SVG (переносится, не обрезается вьюбоксом, в отличие от <text>).
  const svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${grid}${spokes}<polygon points="${poly}" fill="rgba(101,163,13,0.18)" stroke="#65A30D" stroke-width="1.5"/>${dots}${labels}</svg>`;
  return opts.title
    ? `<div style="text-align:center"><div style="font-size:11px;font-weight:800;color:#12161c;margin-bottom:2px">${esc(opts.title)}</div>${svg}</div>`
    : svg;
}

/* ── Полукруговой gauge (0..max) для итогового балла ── */
export function svgGauge(value: number, opts: { max?: number; size?: number; label?: string; tone?: string } = {}): string {
  const max = opts.max ?? 100, size = opts.size ?? 140, r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const frac = Math.max(0, Math.min(1, value / max));
  const a0 = Math.PI, a1 = Math.PI + frac * Math.PI;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const xe = cx + r * Math.cos(2 * Math.PI), ye = cy + r * Math.sin(2 * Math.PI);
  const col = opts.tone ? toneColor(opts.tone) : frac >= 0.7 ? '#16a34a' : frac >= 0.45 ? '#d97706' : '#dc2626';
  return `<svg viewBox="0 0 ${size} ${size * 0.62}" width="${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${xe.toFixed(1)},${ye.toFixed(1)}" fill="none" stroke="#eef1f4" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="22" font-weight="800" fill="#12161c">${esc(String(value))}</text>
    ${opts.label ? `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="8" fill="#5a6472">${esc(opts.label)}</text>` : ''}</svg>`;
}
