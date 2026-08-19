// SSRF-guard для серверных fetch-функций (api/fetch.js, api/aqc.js).
// Клиент передаёт URL — сервер обязан не дать увести запрос во внутреннюю сеть.
// Блокирует: не-http(s), приватные/зарезервированные IP (в т.ч. metadata 169.254.169.254),
// внутренние хосты (localhost/*.internal/*.local), и приватные адреса после DNS-резолва
// (базовая защита от DNS→private). Редиректы проверяются на каждом хопе.
import dns from 'node:dns/promises';
import net from 'node:net';

function ipIsPrivate(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;                          // 10/8
    if (p[0] === 127) return true;                         // loopback
    if (p[0] === 0) return true;                           // 0.0.0.0/8
    if (p[0] === 169 && p[1] === 254) return true;         // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // 172.16/12
    if (p[0] === 192 && p[1] === 168) return true;         // 192.168/16
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT 100.64/10
    return false;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::1' || l === '::') return true;            // loopback / unspecified
    if (l.startsWith('fe80') || l.startsWith('fc') || l.startsWith('fd')) return true; // link-local / ULA
    const m = l.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);      // IPv4-mapped
    if (m) return ipIsPrivate(m[1]);
    return false;
  }
  return true; // неизвестный формат → считаем небезопасным
}

const BLOCK_HOSTS = /(^|\.)(localhost|internal|local|metadata\.google\.internal)$/i;

/** Бросает Error(code), если URL небезопасен. Возвращает распарсенный URL. */
export async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('ssrf:bad-url'); }
  if (!/^https?:$/.test(u.protocol)) throw new Error('ssrf:scheme');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (BLOCK_HOSTS.test(host)) throw new Error('ssrf:blocked-host');
  if (net.isIP(host)) { if (ipIsPrivate(host)) throw new Error('ssrf:private-ip'); return u; }
  let addrs;
  try { addrs = await dns.lookup(host, { all: true }); } catch { throw new Error('ssrf:dns'); }
  if (!addrs.length) throw new Error('ssrf:no-address');
  for (const a of addrs) if (ipIsPrivate(a.address)) throw new Error('ssrf:private-resolved');
  return u;
}

/** fetch с проверкой каждого хоста и ручной обработкой редиректов (защита от redirect→private). */
export async function safeFetch(raw, opts = {}, maxRedirects = 3) {
  let current = raw;
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicUrl(current);
    const r = await fetch(current, { ...opts, redirect: 'manual' });
    const loc = r.status >= 300 && r.status < 400 ? r.headers.get('location') : null;
    if (loc) { current = new URL(loc, current).href; continue; }
    return r;
  }
  throw new Error('ssrf:too-many-redirects');
}
