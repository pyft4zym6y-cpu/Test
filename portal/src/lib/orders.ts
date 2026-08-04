/**
 * Разбор выгрузки заказов (AC-13) прямо в браузере: файл никуда не отправляется.
 * Считает факт по рычагам модели выручки + концентрацию, каналы, возвраты.
 */

export type OrdersMetrics = {
  rows: number;
  months: number;
  monthlyRevenue: number; // средняя выручка/мес за последние 3 полных месяца, ₴
  monthlyOrders: number;
  aov: number;
  activeBase: number; // уникальных покупателей за период
  monthlyRepeatShare: number; // % базы, покупающий повторно в месяц
  ordersPerRepeat: number; // заказов на повторного покупателя в месяц
  repeatRevenueShare: number; // % выручки от повторных
  top10Share: number; // % выручки на топ-10% клиентов
  returnsShare: number; // % заказов со статусом возврат/отмена
  channels: { name: string; share: number }[];
  firstMonth: string;
  lastMonth: string;
};

const num = (s: string) => {
  const v = parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
};

const COL_ALIASES: Record<string, string[]> = {
  id: ['order_id', 'id', 'номер', 'номер заказа', 'заказ'],
  date: ['order_date', 'date', 'дата', 'дата заказа', 'created'],
  customer: ['customer_id', 'customer', 'customer_email', 'customer_email_hash', 'email', 'клиент', 'телефон', 'phone'],
  total: ['total_uah', 'total', 'сумма', 'сумма заказа', 'amount', 'итого'],
  status: ['status', 'статус'],
  channel: ['channel', 'канал', 'источник', 'source'],
};

function detectCols(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = h.trim().toLowerCase();
    for (const [key, aliases] of Object.entries(COL_ALIASES)) {
      if (map[key] == null && aliases.some((a) => n === a || n.startsWith(a))) map[key] = i;
    }
  });
  return map;
}

const BAD_STATUS = /возврат|отмен|returned|cancel|refund/i;

function parseDate(s: string): Date | null {
  const t = String(s ?? '').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(t);
  return isNaN(+d) ? null : d;
}

function splitCsv(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === delim && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, '').trim());
}

export function parseOrdersCsv(text: string): OrdersMetrics | { error: string } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 3) return { error: 'В файле меньше двух строк данных' };
  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const header = splitCsv(lines[0], delim);
  const cols = detectCols(header);
  if (cols.date == null || cols.total == null)
    return { error: `Не нашёл колонки даты и суммы. Заголовки: ${header.slice(0, 8).join(', ')}` };

  type O = { date: Date; month: string; customer: string; total: number; bad: boolean; channel: string };
  const orders: O[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsv(lines[i], delim);
    const d = parseDate(c[cols.date]);
    if (!d) continue;
    orders.push({
      date: d,
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      customer: cols.customer != null ? c[cols.customer] || `?${i}` : `?${i}`,
      total: num(c[cols.total]),
      bad: cols.status != null ? BAD_STATUS.test(c[cols.status] ?? '') : false,
      channel: cols.channel != null ? (c[cols.channel] || 'не указан') : 'не указан',
    });
  }
  if (orders.length < 2) return { error: 'Не удалось разобрать строки заказов' };

  const good = orders.filter((o) => !o.bad && o.total > 0);
  const months = [...new Set(good.map((o) => o.month))].sort();
  const byMonth = new Map<string, O[]>();
  good.forEach((o) => byMonth.set(o.month, [...(byMonth.get(o.month) ?? []), o]));

  // последние 3 полных месяца (последний месяц в данных может быть неполным — отбрасываем его, если есть что-то ещё)
  const fullMonths = months.length > 3 ? months.slice(0, -1) : months;
  const last3 = fullMonths.slice(-3);
  const rev3 = last3.map((m) => (byMonth.get(m) ?? []).reduce((s, o) => s + o.total, 0));
  const ord3 = last3.map((m) => (byMonth.get(m) ?? []).length);
  const monthlyRevenue = rev3.length ? rev3.reduce((s, v) => s + v, 0) / rev3.length : 0;
  const monthlyOrders = ord3.length ? ord3.reduce((s, v) => s + v, 0) / ord3.length : 0;

  const totalRev = good.reduce((s, o) => s + o.total, 0);
  const aov = totalRev / good.length;

  // первая покупка каждого клиента — всё после неё считается повторным
  const firstSeen = new Map<string, string>();
  [...good].sort((a, b) => +a.date - +b.date).forEach((o) => {
    if (!firstSeen.has(o.customer)) firstSeen.set(o.customer, o.month);
  });
  const activeBase = firstSeen.size;

  let repeatRevenue = 0;
  const repShares: number[] = [];
  const oprs: number[] = [];
  for (const m of last3) {
    const os = byMonth.get(m) ?? [];
    const repOrders = os.filter((o) => firstSeen.get(o.customer)! < m);
    const repBuyers = new Set(repOrders.map((o) => o.customer)).size;
    repShares.push(activeBase ? (repBuyers / activeBase) * 100 : 0);
    oprs.push(repBuyers ? repOrders.length / repBuyers : 0);
  }
  good.forEach((o) => { if (firstSeen.get(o.customer)! < o.month) repeatRevenue += o.total; });

  const perCustomer = new Map<string, number>();
  good.forEach((o) => perCustomer.set(o.customer, (perCustomer.get(o.customer) ?? 0) + o.total));
  const sorted = [...perCustomer.values()].sort((a, b) => b - a);
  const topN = Math.max(1, Math.round(sorted.length * 0.1));
  const top10Share = totalRev ? (sorted.slice(0, topN).reduce((s, v) => s + v, 0) / totalRev) * 100 : 0;

  const chMap = new Map<string, number>();
  good.forEach((o) => chMap.set(o.channel, (chMap.get(o.channel) ?? 0) + o.total));
  const channels = [...chMap.entries()]
    .map(([name, v]) => ({ name, share: Math.round((v / totalRev) * 100) }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 6);

  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

  return {
    rows: orders.length,
    months: months.length,
    monthlyRevenue: Math.round(monthlyRevenue),
    monthlyOrders: Math.round(monthlyOrders),
    aov: Math.round(aov),
    activeBase,
    monthlyRepeatShare: Math.round(avg(repShares) * 10) / 10,
    ordersPerRepeat: Math.round(avg(oprs) * 100) / 100,
    repeatRevenueShare: Math.round((repeatRevenue / totalRev) * 100),
    top10Share: Math.round(top10Share),
    returnsShare: Math.round((orders.filter((o) => o.bad).length / orders.length) * 100),
    channels,
    firstMonth: months[0] ?? '',
    lastMonth: months[months.length - 1] ?? '',
  };
}
